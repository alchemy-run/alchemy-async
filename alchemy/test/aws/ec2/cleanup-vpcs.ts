#!/usr/bin/env bun
/*
!!!!NOTE!!!: Be careful running this testing utility. It's meant to recursively delete lots of shit in your aws account!
*/
import {
  DeleteInternetGatewayCommand,
  DeleteNatGatewayCommand,
  DeleteRouteCommand,
  DeleteRouteTableCommand,
  DeleteSecurityGroupCommand,
  DeleteSubnetCommand,
  DeleteVpcCommand,
  DescribeAddressesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  DetachInternetGatewayCommand,
  EC2Client,
  ReleaseAddressCommand,
} from "@aws-sdk/client-ec2";
import * as fs from "node:fs";
import path from "pathe";
import { BRANCH_PREFIX } from "../../util.ts";

const ec2 = new EC2Client({});

async function cleanupAlchemyState() {
  console.log("Cleaning up Alchemy state...");

  const stateDir = path.join(process.cwd(), ".alchemy");

  try {
    // Check if .alchemy directory exists
    if (!fs.existsSync(stateDir)) {
      console.log("  No Alchemy state directory found");
      return;
    }

    // Find and remove test-related state directories
    const entries = await fs.promises.readdir(stateDir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.includes(BRANCH_PREFIX)) {
        const testStateDir = path.join(stateDir, entry.name);
        console.log(`  Removing test state directory: ${testStateDir}`);
        await fs.promises.rm(testStateDir, { recursive: true, force: true });
      }
    }

    console.log("  ✓ Alchemy state cleanup completed");
  } catch (error) {
    console.error("  ✗ Error cleaning up Alchemy state:", error);
  }
}

async function cleanupOrphanedNatGateways() {
  console.log("Checking for orphaned NAT Gateways...");

  try {
    const natGateways = await ec2.send(new DescribeNatGatewaysCommand({}));

    for (const nat of natGateways.NatGateways || []) {
      if (
        nat.Tags?.some(
          (tag) => tag.Key === "Name" && tag.Value?.includes(BRANCH_PREFIX),
        )
      ) {
        console.log(
          `  Found test NAT Gateway: ${nat.NatGatewayId} (State: ${nat.State})`,
        );

        if (nat.State !== "deleted" && nat.State !== "deleting") {
          console.log(`    Deleting NAT Gateway: ${nat.NatGatewayId}`);
          try {
            await ec2.send(
              new DeleteNatGatewayCommand({ NatGatewayId: nat.NatGatewayId }),
            );
          } catch (error: any) {
            console.error(`    Error deleting NAT Gateway: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking NAT Gateways:", error);
  }
}

async function cleanupOrphanedElasticIPs() {
  console.log("Cleaning up orphaned Elastic IPs...");

  try {
    const addresses = await ec2.send(new DescribeAddressesCommand({}));

    for (const address of addresses.Addresses || []) {
      // Check if the EIP is not associated with any instance or NAT Gateway
      if (
        !address.InstanceId &&
        !address.NetworkInterfaceId &&
        address.AllocationId
      ) {
        // Check if it has test-related tags or was created recently
        const shouldRelease =
          address.Tags?.some(
            (tag) => tag.Key === "Name" && tag.Value?.includes(BRANCH_PREFIX),
          ) || !address.AssociationId; // Unassociated EIPs

        if (shouldRelease) {
          try {
            console.log(
              `  Releasing orphaned Elastic IP: ${address.AllocationId} (${address.PublicIp})`,
            );
            await ec2.send(
              new ReleaseAddressCommand({
                AllocationId: address.AllocationId,
              }),
            );
          } catch (error: any) {
            if (error.name !== "InvalidAllocationID.NotFound") {
              console.error(
                `    Error releasing EIP ${address.AllocationId}:`,
                error.message,
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up orphaned Elastic IPs:", error);
  }
}

async function cleanupTestVpcs() {
  console.log(`Cleaning up test VPCs with prefix: ${BRANCH_PREFIX}`);

  try {
    // First clean up orphaned NAT Gateways
    await cleanupOrphanedNatGateways();

    // Then clean up orphaned Elastic IPs
    await cleanupOrphanedElasticIPs();
    // Get all VPCs
    const vpcsResponse = await ec2.send(new DescribeVpcsCommand({}));
    const testVpcs =
      vpcsResponse.Vpcs?.filter((vpc) =>
        vpc.Tags?.some(
          (tag) =>
            tag.Key === "Name" &&
            tag.Value?.includes(BRANCH_PREFIX) &&
            tag.Value?.includes("alchemy-test"),
        ),
      ) || [];

    console.log(`Found ${testVpcs.length} test VPCs to clean up`);

    for (const vpc of testVpcs) {
      console.log(
        `Cleaning up VPC: ${vpc.VpcId} (${vpc.Tags?.find((t) => t.Key === "Name")?.Value})`,
      );
      await cleanupVpc(vpc.VpcId!);
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

async function inventoryVpcResources(vpcId: string) {
  console.log(`  📋 Inventorying all resources in VPC: ${vpcId}`);

  try {
    // Check NAT Gateways
    const natGateways = await ec2.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    console.log(`    NAT Gateways: ${natGateways.NatGateways?.length || 0}`);
    for (const nat of natGateways.NatGateways || []) {
      console.log(
        `      - ${nat.NatGatewayId} (State: ${nat.State}, Subnet: ${nat.SubnetId})`,
      );
    }

    // Check Internet Gateways
    const igws = await ec2.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }],
      }),
    );
    console.log(`    Internet Gateways: ${igws.InternetGateways?.length || 0}`);
    for (const igw of igws.InternetGateways || []) {
      console.log(
        `      - ${igw.InternetGatewayId} (Attachments: ${igw.Attachments?.length || 0})`,
      );
    }

    // Check Subnets
    const subnets = await ec2.send(
      new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    console.log(`    Subnets: ${subnets.Subnets?.length || 0}`);
    for (const subnet of subnets.Subnets || []) {
      const name =
        subnet.Tags?.find((t) => t.Key === "Name")?.Value || "unnamed";
      console.log(
        `      - ${subnet.SubnetId} (${name}, AZ: ${subnet.AvailabilityZone})`,
      );
    }

    // Check Route Tables
    const routeTables = await ec2.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    console.log(`    Route Tables: ${routeTables.RouteTables?.length || 0}`);
    for (const rt of routeTables.RouteTables || []) {
      const isMain = rt.Associations?.some((assoc) => assoc.Main);
      const name = rt.Tags?.find((t) => t.Key === "Name")?.Value || "unnamed";
      console.log(
        `      - ${rt.RouteTableId} (${name}, Main: ${isMain}, Routes: ${rt.Routes?.length || 0})`,
      );

      // Show routes
      for (const route of rt.Routes || []) {
        if (route.Origin === "CreateRoute") {
          console.log(
            `        Route: ${route.DestinationCidrBlock} -> ${route.GatewayId || route.NatGatewayId || route.InstanceId || "unknown"}`,
          );
        }
      }
    }

    // Check Security Groups
    const securityGroups = await ec2.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    const nonDefaultSGs =
      securityGroups.SecurityGroups?.filter(
        (sg) => sg.GroupName !== "default",
      ) || [];
    console.log(`    Security Groups (non-default): ${nonDefaultSGs.length}`);
    for (const sg of nonDefaultSGs) {
      console.log(`      - ${sg.GroupId} (${sg.GroupName})`);
    }

    // Check Elastic IPs associated with this VPC
    const addresses = await ec2.send(new DescribeAddressesCommand({}));
    const vpcEips =
      addresses.Addresses?.filter((addr) =>
        addr.NetworkInterfaceId?.includes(vpcId),
      ) || [];
    console.log(`    Elastic IPs: ${vpcEips.length}`);
    for (const eip of vpcEips) {
      console.log(
        `      - ${eip.AllocationId} (${eip.PublicIp}, Associated: ${!!eip.AssociationId})`,
      );
    }
  } catch (error) {
    console.error("    ✗ Error inventorying VPC resources:", error);
  }
}

async function cleanupVpc(vpcId: string) {
  try {
    console.log(`  Starting cleanup for VPC: ${vpcId}`);

    // First, let's inventory all resources in this VPC
    await inventoryVpcResources(vpcId);

    // 1. Delete NAT Gateways and release their Elastic IPs
    console.log(`  Step 1: Checking NAT Gateways in VPC ${vpcId}`);
    const natGateways = await ec2.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );

    console.log(`  Found ${natGateways.NatGateways?.length || 0} NAT Gateways`);
    const elasticIpsToRelease: string[] = [];

    for (const nat of natGateways.NatGateways || []) {
      if (nat.State !== "deleted" && nat.State !== "deleting") {
        console.log(
          `  Deleting NAT Gateway: ${nat.NatGatewayId} (State: ${nat.State})`,
        );

        // Collect Elastic IP allocation IDs for later release
        if (nat.NatGatewayAddresses) {
          for (const address of nat.NatGatewayAddresses) {
            if (address.AllocationId) {
              elasticIpsToRelease.push(address.AllocationId);
              console.log(
                `    Will release EIP: ${address.AllocationId} (${address.PublicIp})`,
              );
            }
          }
        }

        try {
          await ec2.send(
            new DeleteNatGatewayCommand({
              NatGatewayId: nat.NatGatewayId,
            }),
          );
          console.log(`    NAT Gateway ${nat.NatGatewayId} deletion initiated`);
        } catch (error: any) {
          console.error(
            `    Error deleting NAT Gateway ${nat.NatGatewayId}:`,
            error.message,
          );
        }
        // Wait for NAT Gateway to start deleting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.log(
          `  NAT Gateway ${nat.NatGatewayId} already in state: ${nat.State}`,
        );
      }
    }

    // Wait for NAT Gateways to be deleted before releasing EIPs
    if (elasticIpsToRelease.length > 0) {
      console.log(
        `  Waiting for NAT Gateways to be deleted before releasing ${elasticIpsToRelease.length} Elastic IPs...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

      for (const allocationId of elasticIpsToRelease) {
        try {
          console.log(`  Releasing Elastic IP: ${allocationId}`);
          await ec2.send(
            new ReleaseAddressCommand({
              AllocationId: allocationId,
            }),
          );
          console.log(`    EIP ${allocationId} released successfully`);
        } catch (error: any) {
          if (error.name === "InvalidAllocationID.NotFound") {
            console.log(`    Elastic IP ${allocationId} already released`);
          } else {
            console.error(
              `    Error releasing Elastic IP ${allocationId}:`,
              error.message,
            );
          }
        }
      }
    }

    // 2. Delete Routes from Route Tables first
    const routeTablesForRoutes = await ec2.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );

    for (const rt of routeTablesForRoutes.RouteTables || []) {
      if (rt.Routes) {
        for (const route of rt.Routes) {
          // Skip local routes (created automatically) and only delete manually created routes
          if (route.Origin === "CreateRoute" && route.DestinationCidrBlock) {
            try {
              console.log(
                `  Deleting Route: ${route.DestinationCidrBlock} from ${rt.RouteTableId}`,
              );
              await ec2.send(
                new DeleteRouteCommand({
                  RouteTableId: rt.RouteTableId,
                  DestinationCidrBlock: route.DestinationCidrBlock,
                }),
              );
            } catch (error: any) {
              if (error.name !== "InvalidRoute.NotFound") {
                console.error("    Error deleting route:", error.message);
              }
            }
          }
        }
      }
    }

    // Wait a bit for routes to be deleted
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 3. Detach and delete Internet Gateways
    const igws = await ec2.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }],
      }),
    );

    for (const igw of igws.InternetGateways || []) {
      console.log(
        `  Detaching and deleting Internet Gateway: ${igw.InternetGatewayId}`,
      );
      try {
        await ec2.send(
          new DetachInternetGatewayCommand({
            InternetGatewayId: igw.InternetGatewayId,
            VpcId: vpcId,
          }),
        );
        // Wait a bit for detachment to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await ec2.send(
          new DeleteInternetGatewayCommand({
            InternetGatewayId: igw.InternetGatewayId,
          }),
        );
      } catch (error: any) {
        if (!error.message.includes("NotFound")) {
          console.error("    Error with Internet Gateway:", error.message);
        }
      }
    }

    // 3. Delete Subnets
    const subnets = await ec2.send(
      new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );

    for (const subnet of subnets.Subnets || []) {
      console.log(`  Deleting Subnet: ${subnet.SubnetId}`);
      await ec2.send(
        new DeleteSubnetCommand({
          SubnetId: subnet.SubnetId,
        }),
      );
    }

    // 4. Delete Security Groups (except default)
    const securityGroups = await ec2.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );

    for (const sg of securityGroups.SecurityGroups || []) {
      if (sg.GroupName !== "default") {
        console.log(
          `  Deleting Security Group: ${sg.GroupId} (${sg.GroupName})`,
        );
        await ec2.send(
          new DeleteSecurityGroupCommand({
            GroupId: sg.GroupId,
          }),
        );
      }
    }

    // 5. Delete Route Tables (except main)
    const routeTables = await ec2.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );

    for (const rt of routeTables.RouteTables || []) {
      const isMain = rt.Associations?.some((assoc) => assoc.Main);
      if (!isMain) {
        console.log(`  Deleting Route Table: ${rt.RouteTableId}`);
        await ec2.send(
          new DeleteRouteTableCommand({
            RouteTableId: rt.RouteTableId,
          }),
        );
      }
    }

    // 6. Finally, delete the VPC
    console.log(`  Deleting VPC: ${vpcId}`);
    await ec2.send(new DeleteVpcCommand({ VpcId: vpcId }));

    // 7. Verify cleanup was successful
    console.log(`  Verifying cleanup for VPC: ${vpcId}`);
    await verifyVpcCleanup(vpcId);

    console.log(`  ✓ VPC ${vpcId} cleanup completed`);
  } catch (error) {
    console.error(`  ✗ Error cleaning up VPC ${vpcId}:`, error);
  }
}

async function verifyVpcCleanup(vpcId: string) {
  const errors: string[] = [];

  try {
    // Check if VPC still exists
    try {
      const vpcsResponse = await ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        }),
      );
      if (vpcsResponse.Vpcs && vpcsResponse.Vpcs.length > 0) {
        errors.push(`VPC ${vpcId} still exists`);
      }
    } catch (error: any) {
      if (error.name !== "InvalidVpcID.NotFound") {
        errors.push(`Error checking VPC: ${error.message}`);
      } else {
        console.log(`    ✓ VPC ${vpcId} successfully deleted`);
      }
    }

    // Check for remaining NAT Gateways
    const natGateways = await ec2.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    const activeNats =
      natGateways.NatGateways?.filter(
        (nat) => nat.State !== "deleted" && nat.State !== "deleting",
      ) || [];
    if (activeNats.length > 0) {
      errors.push(
        `${activeNats.length} NAT Gateways still active in VPC ${vpcId}`,
      );
    } else {
      console.log("    ✓ No active NAT Gateways remaining");
    }

    // Check for remaining Internet Gateways
    const igws = await ec2.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }],
      }),
    );
    if (igws.InternetGateways && igws.InternetGateways.length > 0) {
      errors.push(
        `${igws.InternetGateways.length} Internet Gateways still attached to VPC ${vpcId}`,
      );
    } else {
      console.log("    ✓ No Internet Gateways attached");
    }

    // Check for remaining Subnets
    const subnets = await ec2.send(
      new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    if (subnets.Subnets && subnets.Subnets.length > 0) {
      errors.push(
        `${subnets.Subnets.length} Subnets still exist in VPC ${vpcId}`,
      );
    } else {
      console.log("    ✓ No Subnets remaining");
    }

    // Check for remaining Route Tables (excluding main)
    const routeTables = await ec2.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    const nonMainRouteTables =
      routeTables.RouteTables?.filter(
        (rt) => !rt.Associations?.some((assoc) => assoc.Main),
      ) || [];
    if (nonMainRouteTables.length > 0) {
      errors.push(
        `${nonMainRouteTables.length} non-main Route Tables still exist in VPC ${vpcId}`,
      );
    } else {
      console.log("    ✓ No non-main Route Tables remaining");
    }

    // Check for remaining Security Groups (excluding default)
    const securityGroups = await ec2.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      }),
    );
    const nonDefaultSGs =
      securityGroups.SecurityGroups?.filter(
        (sg) => sg.GroupName !== "default",
      ) || [];
    if (nonDefaultSGs.length > 0) {
      errors.push(
        `${nonDefaultSGs.length} non-default Security Groups still exist in VPC ${vpcId}`,
      );
    } else {
      console.log("    ✓ No non-default Security Groups remaining");
    }

    if (errors.length > 0) {
      console.error(`    ✗ Cleanup verification failed for VPC ${vpcId}:`);
      for (const error of errors) {
        console.error(`      - ${error}`);
      }
    } else {
      console.log(
        `    ✓ All resources successfully cleaned up for VPC ${vpcId}`,
      );
    }
  } catch (error) {
    console.error("    ✗ Error during cleanup verification:", error);
  }
}

// Run cleanup if this script is executed directly
if (import.meta.main) {
  await cleanupTestVpcs();
  await cleanupAlchemyState();
  console.log("Cleanup completed successfully!");
}
