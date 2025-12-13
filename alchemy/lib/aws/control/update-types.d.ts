declare const updateTypes: {
    ACMPCA: {
        Certificate: {
            TemplateArn: string;
            CertificateAuthorityArn: string;
            Validity: string;
            CertificateSigningRequest: string;
            SigningAlgorithm: string;
            ApiPassthrough: string;
            ValidityNotBefore: string;
        };
        CertificateAuthority: {
            CsrExtensions: string;
            Type: string;
            RevocationConfiguration: string;
            UsageMode: string;
            SigningAlgorithm: string;
            KeyStorageSecurityStandard: string;
            Subject: string;
            Tags: string;
            KeyAlgorithm: string;
        };
        CertificateAuthorityActivation: {
            Status: string;
            CertificateAuthorityArn: string;
            CertificateChain: string;
            Certificate: string;
        };
        Permission: {
            CertificateAuthorityArn: string;
            Actions: string;
            SourceAccount: string;
            Principal: string;
        };
    };
    AIOps: {
        InvestigationGroup: {
            RetentionInDays: string;
            CrossAccountConfigurations: string;
            InvestigationGroupPolicy: string;
            ChatbotNotificationChannels: string;
            IsCloudTrailEventHistoryEnabled: string;
            TagKeyBoundaries: string;
            EncryptionConfig: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
    };
    APS: {
        ResourcePolicy: {
            WorkspaceArn: string;
            PolicyDocument: string;
        };
        RuleGroupsNamespace: {
            Data: string;
            Tags: string;
            Workspace: string;
            Name: string;
        };
        Scraper: {
            ScrapeConfiguration: string;
            Destination: string;
            ScraperLoggingConfiguration: string;
            Alias: string;
            RoleConfiguration: string;
            Source: string;
            Tags: string;
        };
        Workspace: {
            KmsKeyArn: string;
            QueryLoggingConfiguration: string;
            Alias: string;
            LoggingConfiguration: string;
            WorkspaceConfiguration: string;
            AlertManagerDefinition: string;
            Tags: string;
        };
    };
    ARCRegionSwitch: {
        Plan: {
            Description: string;
            PrimaryRegion: string;
            Workflows: string;
            RecoveryTimeObjectiveMinutes: string;
            Regions: string;
            Triggers: string;
            AssociatedAlarms: string;
            RecoveryApproach: string;
            ExecutionRole: string;
            Tags: string;
            Name: string;
        };
    };
    ARCZonalShift: {
        AutoshiftObserverNotificationStatus: {
            Status: string;
        };
        ZonalAutoshiftConfiguration: {
            ResourceIdentifier: string;
            ZonalAutoshiftStatus: string;
            PracticeRunConfiguration: string;
        };
    };
    AccessAnalyzer: {
        Analyzer: {
            ArchiveRules: string;
            Type: string;
            AnalyzerName: string;
            Tags: string;
            AnalyzerConfiguration: string;
        };
    };
    AmazonMQ: {
        Broker: {
            SecurityGroups: string;
            DataReplicationPrimaryBrokerArn: string;
            StorageType: string;
            EngineVersion: string;
            Configuration: string;
            AuthenticationStrategy: string;
            MaintenanceWindowStartTime: string;
            HostInstanceType: string;
            AutoMinorVersionUpgrade: string;
            Users: string;
            Logs: string;
            SubnetIds: string;
            DataReplicationMode: string;
            BrokerName: string;
            LdapServerMetadata: string;
            DeploymentMode: string;
            EngineType: string;
            PubliclyAccessible: string;
            EncryptionOptions: string;
            Tags: string;
        };
        Configuration: {
            EngineVersion: string;
            Description: string;
            AuthenticationStrategy: string;
            EngineType: string;
            Data: string;
            Tags: string;
            Name: string;
        };
        ConfigurationAssociation: {
            Broker: string;
            Configuration: string;
        };
    };
    Amplify: {
        App: {
            AutoBranchCreationConfig: string;
            OauthToken: string;
            Description: string;
            Platform: string;
            EnableBranchAutoDeletion: string;
            JobConfig: string;
            Name: string;
            ComputeRoleArn: string;
            Repository: string;
            EnvironmentVariables: string;
            AccessToken: string;
            BuildSpec: string;
            CustomRules: string;
            BasicAuthConfig: string;
            CacheConfig: string;
            CustomHeaders: string;
            Tags: string;
            IAMServiceRole: string;
        };
        Branch: {
            Description: string;
            EnablePerformanceMode: string;
            ComputeRoleArn: string;
            Backend: string;
            EnvironmentVariables: string;
            AppId: string;
            PullRequestEnvironmentName: string;
            EnablePullRequestPreview: string;
            EnableSkewProtection: string;
            EnableAutoBuild: string;
            BuildSpec: string;
            Stage: string;
            BranchName: string;
            BasicAuthConfig: string;
            Framework: string;
            Tags: string;
        };
        Domain: {
            SubDomainSettings: string;
            AppId: string;
            AutoSubDomainIAMRole: string;
            DomainName: string;
            CertificateSettings: string;
            EnableAutoSubDomain: string;
            AutoSubDomainCreationPatterns: string;
        };
    };
    AmplifyUIBuilder: {
        Component: {
            ComponentType: string;
            SchemaVersion: string;
            EnvironmentName: string;
            BindingProperties: string;
            SourceId: string;
            Properties: string;
            CollectionProperties: string;
            Name: string;
            Variants: string;
            AppId: string;
            Events: string;
            Overrides: string;
            Children: string;
            Tags: string;
        };
        Form: {
            FormActionType: string;
            Cta: string;
            Fields: string;
            SchemaVersion: string;
            AppId: string;
            EnvironmentName: string;
            LabelDecorator: string;
            SectionalElements: string;
            DataType: string;
            Style: string;
            Tags: string;
            Name: string;
        };
        Theme: {
            AppId: string;
            EnvironmentName: string;
            Values: string;
            Overrides: string;
            Tags: string;
            Name: string;
        };
    };
    ApiGateway: {
        Account: {
            CloudWatchRoleArn: string;
        };
        ApiKey: {
            Description: string;
            StageKeys: string;
            Value: string;
            Enabled: string;
            CustomerId: string;
            GenerateDistinctId: string;
            Tags: string;
            Name: string;
        };
        Authorizer: {
            ProviderARNs: string;
            AuthorizerCredentials: string;
            IdentityValidationExpression: string;
            Type: string;
            AuthorizerUri: string;
            AuthorizerResultTtlInSeconds: string;
            RestApiId: string;
            IdentitySource: string;
            AuthType: string;
            Name: string;
        };
        BasePathMapping: {
            DomainName: string;
            RestApiId: string;
            Stage: string;
            BasePath: string;
            Id: string;
        };
        BasePathMappingV2: {
            DomainNameArn: string;
            RestApiId: string;
            Stage: string;
            BasePath: string;
        };
        ClientCertificate: {
            Description: string;
            Tags: string;
        };
        Deployment: {
            Description: string;
            StageDescription: string;
            StageName: string;
            RestApiId: string;
            DeploymentCanarySettings: string;
        };
        DocumentationPart: {
            RestApiId: string;
            Properties: string;
            Location: string;
        };
        DocumentationVersion: {
            Description: string;
            DocumentationVersion: string;
            RestApiId: string;
        };
        DomainName: {
            OwnershipVerificationCertificateArn: string;
            MutualTlsAuthentication: string;
            RoutingMode: string;
            DomainName: string;
            SecurityPolicy: string;
            EndpointConfiguration: string;
            RegionalCertificateArn: string;
            Tags: string;
            CertificateArn: string;
        };
        DomainNameAccessAssociation: {
            DomainNameArn: string;
            AccessAssociationSource: string;
            AccessAssociationSourceType: string;
            Tags: string;
        };
        DomainNameV2: {
            Policy: string;
            RoutingMode: string;
            DomainName: string;
            SecurityPolicy: string;
            EndpointConfiguration: string;
            Tags: string;
            CertificateArn: string;
        };
        GatewayResponse: {
            ResponseTemplates: string;
            ResponseParameters: string;
            RestApiId: string;
            StatusCode: string;
            ResponseType: string;
        };
        Method: {
            Integration: string;
            OperationName: string;
            RequestModels: string;
            RestApiId: string;
            AuthorizationScopes: string;
            RequestValidatorId: string;
            RequestParameters: string;
            MethodResponses: string;
            AuthorizerId: string;
            ResourceId: string;
            ApiKeyRequired: string;
            AuthorizationType: string;
            HttpMethod: string;
        };
        Model: {
            Description: string;
            ContentType: string;
            Schema: string;
            RestApiId: string;
            Name: string;
        };
        RequestValidator: {
            ValidateRequestParameters: string;
            RestApiId: string;
            ValidateRequestBody: string;
            Name: string;
        };
        Resource: {
            ParentId: string;
            PathPart: string;
            RestApiId: string;
        };
        RestApi: {
            Policy: string;
            BodyS3Location: string;
            Description: string;
            MinimumCompressionSize: string;
            Parameters: string;
            CloneFrom: string;
            Mode: string;
            DisableExecuteApiEndpoint: string;
            FailOnWarnings: string;
            BinaryMediaTypes: string;
            Name: string;
            ApiKeySourceType: string;
            EndpointConfiguration: string;
            Body: string;
            Tags: string;
        };
        Stage: {
            DeploymentId: string;
            Description: string;
            StageName: string;
            RestApiId: string;
            CanarySetting: string;
            ClientCertificateId: string;
            Variables: string;
            DocumentationVersion: string;
            TracingEnabled: string;
            MethodSettings: string;
            AccessLogSetting: string;
            CacheClusterSize: string;
            Tags: string;
            CacheClusterEnabled: string;
        };
        UsagePlan: {
            Description: string;
            Quota: string;
            ApiStages: string;
            Tags: string;
            Throttle: string;
            UsagePlanName: string;
        };
        UsagePlanKey: {
            KeyType: string;
            UsagePlanId: string;
            KeyId: string;
        };
        VpcLink: {
            Description: string;
            TargetArns: string;
            Tags: string;
            Name: string;
        };
    };
    ApiGatewayV2: {
        Api: {
            IpAddressType: string;
            RouteSelectionExpression: string;
            BodyS3Location: string;
            Description: string;
            BasePath: string;
            FailOnWarnings: string;
            DisableExecuteApiEndpoint: string;
            DisableSchemaValidation: string;
            Name: string;
            Target: string;
            CredentialsArn: string;
            CorsConfiguration: string;
            Version: string;
            ProtocolType: string;
            RouteKey: string;
            Body: string;
            Tags: string;
            ApiKeySelectionExpression: string;
        };
        ApiGatewayManagedOverrides: {
            Integration: string;
            Stage: string;
            ApiId: string;
            Route: string;
        };
        ApiMapping: {
            DomainName: string;
            Stage: string;
            ApiMappingKey: string;
            ApiId: string;
        };
        Authorizer: {
            IdentityValidationExpression: string;
            AuthorizerUri: string;
            AuthorizerCredentialsArn: string;
            AuthorizerType: string;
            JwtConfiguration: string;
            AuthorizerResultTtlInSeconds: string;
            IdentitySource: string;
            AuthorizerPayloadFormatVersion: string;
            EnableSimpleResponses: string;
            ApiId: string;
            Name: string;
        };
        Deployment: {
            Description: string;
            StageName: string;
            ApiId: string;
        };
        DomainName: {
            MutualTlsAuthentication: string;
            RoutingMode: string;
            DomainName: string;
            DomainNameConfigurations: string;
            Tags: string;
        };
        Integration: {
            Description: string;
            TemplateSelectionExpression: string;
            ConnectionType: string;
            ResponseParameters: string;
            IntegrationMethod: string;
            PassthroughBehavior: string;
            RequestParameters: string;
            ConnectionId: string;
            IntegrationUri: string;
            PayloadFormatVersion: string;
            CredentialsArn: string;
            RequestTemplates: string;
            TimeoutInMillis: string;
            TlsConfig: string;
            ContentHandlingStrategy: string;
            IntegrationSubtype: string;
            ApiId: string;
            IntegrationType: string;
        };
        IntegrationResponse: {
            ResponseTemplates: string;
            TemplateSelectionExpression: string;
            ResponseParameters: string;
            ContentHandlingStrategy: string;
            IntegrationId: string;
            IntegrationResponseKey: string;
            ApiId: string;
        };
        Model: {
            Description: string;
            ContentType: string;
            Schema: string;
            ApiId: string;
            Name: string;
        };
        Route: {
            Target: string;
            RouteResponseSelectionExpression: string;
            RequestModels: string;
            OperationName: string;
            AuthorizerId: string;
            AuthorizationScopes: string;
            ApiKeyRequired: string;
            RouteKey: string;
            AuthorizationType: string;
            ModelSelectionExpression: string;
            ApiId: string;
            RequestParameters: string;
        };
        RouteResponse: {
            RouteResponseKey: string;
            ResponseParameters: string;
            RouteId: string;
            ModelSelectionExpression: string;
            ApiId: string;
            ResponseModels: string;
        };
        RoutingRule: {
            Actions: string;
            Priority: string;
            DomainNameArn: string;
            Conditions: string;
        };
        Stage: {
            ClientCertificateId: string;
            DeploymentId: string;
            Description: string;
            AccessLogSettings: string;
            AutoDeploy: string;
            RouteSettings: string;
            StageName: string;
            StageVariables: string;
            AccessPolicyId: string;
            ApiId: string;
            DefaultRouteSettings: string;
            Tags: string;
        };
        VpcLink: {
            SubnetIds: string;
            SecurityGroupIds: string;
            Tags: string;
            Name: string;
        };
    };
    AppConfig: {
        Application: {
            Description: string;
            Tags: string;
            Name: string;
        };
        ConfigurationProfile: {
            LocationUri: string;
            Type: string;
            KmsKeyIdentifier: string;
            Description: string;
            Validators: string;
            RetrievalRoleArn: string;
            DeletionProtectionCheck: string;
            ApplicationId: string;
            Tags: string;
            Name: string;
        };
        Deployment: {
            DeploymentStrategyId: string;
            ConfigurationProfileId: string;
            EnvironmentId: string;
            KmsKeyIdentifier: string;
            Description: string;
            ConfigurationVersion: string;
            ApplicationId: string;
            DynamicExtensionParameters: string;
            Tags: string;
        };
        DeploymentStrategy: {
            ReplicateTo: string;
            GrowthType: string;
            Description: string;
            DeploymentDurationInMinutes: string;
            GrowthFactor: string;
            FinalBakeTimeInMinutes: string;
            Tags: string;
            Name: string;
        };
        Environment: {
            Description: string;
            Monitors: string;
            DeletionProtectionCheck: string;
            ApplicationId: string;
            Tags: string;
            Name: string;
        };
        Extension: {
            Description: string;
            Parameters: string;
            Actions: string;
            LatestVersionNumber: string;
            Tags: string;
            Name: string;
        };
        ExtensionAssociation: {
            ResourceIdentifier: string;
            Parameters: string;
            ExtensionIdentifier: string;
            ExtensionVersionNumber: string;
            Tags: string;
        };
        HostedConfigurationVersion: {
            ConfigurationProfileId: string;
            Description: string;
            ContentType: string;
            LatestVersionNumber: string;
            Content: string;
            VersionLabel: string;
            ApplicationId: string;
        };
    };
    AppFlow: {
        Connector: {
            ConnectorLabel: string;
            ConnectorProvisioningType: string;
            Description: string;
            ConnectorProvisioningConfig: string;
        };
        ConnectorProfile: {
            ConnectorLabel: string;
            ConnectorProfileName: string;
            KMSArn: string;
            ConnectorType: string;
            ConnectionMode: string;
            ConnectorProfileConfig: string;
        };
        Flow: {
            Description: string;
            KMSArn: string;
            Tasks: string;
            FlowName: string;
            TriggerConfig: string;
            DestinationFlowConfigList: string;
            SourceFlowConfig: string;
            FlowStatus: string;
            Tags: string;
            MetadataCatalogConfig: string;
        };
    };
    AppIntegrations: {
        Application: {
            ApplicationSourceConfig: string;
            Description: string;
            InitializationTimeout: string;
            ApplicationConfig: string;
            IframeConfig: string;
            Permissions: string;
            IsService: string;
            Namespace: string;
            Tags: string;
            Name: string;
        };
        DataIntegration: {
            ScheduleConfig: string;
            FileConfiguration: string;
            Description: string;
            SourceURI: string;
            ObjectConfiguration: string;
            KmsKey: string;
            Tags: string;
            Name: string;
        };
        EventIntegration: {
            Description: string;
            EventBridgeBus: string;
            EventFilter: string;
            Tags: string;
            Name: string;
        };
    };
    AppMesh: {
        GatewayRoute: {
            MeshName: string;
            VirtualGatewayName: string;
            MeshOwner: string;
            GatewayRouteName: string;
            Spec: string;
            Tags: string;
        };
        Mesh: {
            MeshName: string;
            Spec: string;
            Tags: string;
        };
        Route: {
            MeshName: string;
            VirtualRouterName: string;
            MeshOwner: string;
            RouteName: string;
            Spec: string;
            Tags: string;
        };
        VirtualGateway: {
            VirtualGatewayName: string;
            MeshName: string;
            MeshOwner: string;
            Spec: string;
            Tags: string;
        };
        VirtualNode: {
            MeshName: string;
            MeshOwner: string;
            Spec: string;
            VirtualNodeName: string;
            Tags: string;
        };
        VirtualRouter: {
            MeshName: string;
            VirtualRouterName: string;
            MeshOwner: string;
            Spec: string;
            Tags: string;
        };
        VirtualService: {
            MeshName: string;
            MeshOwner: string;
            VirtualServiceName: string;
            Spec: string;
            Tags: string;
        };
    };
    AppRunner: {
        AutoScalingConfiguration: {
            MinSize: string;
            MaxConcurrency: string;
            AutoScalingConfigurationName: string;
            MaxSize: string;
            Tags: string;
        };
        ObservabilityConfiguration: {
            TraceConfiguration: string;
            ObservabilityConfigurationName: string;
            Tags: string;
        };
        Service: {
            HealthCheckConfiguration: string;
            InstanceConfiguration: string;
            EncryptionConfiguration: string;
            ServiceName: string;
            ObservabilityConfiguration: string;
            SourceConfiguration: string;
            AutoScalingConfigurationArn: string;
            NetworkConfiguration: string;
            Tags: string;
        };
        VpcConnector: {
            SecurityGroups: string;
            Subnets: string;
            VpcConnectorName: string;
            Tags: string;
        };
        VpcIngressConnection: {
            VpcIngressConnectionName: string;
            ServiceArn: string;
            Tags: string;
            IngressVpcConfiguration: string;
        };
    };
    AppStream: {
        AppBlock: {
            SetupScriptDetails: string;
            Description: string;
            PostSetupScriptDetails: string;
            DisplayName: string;
            SourceS3Location: string;
            Tags: string;
            PackagingType: string;
            Name: string;
        };
        AppBlockBuilder: {
            Description: string;
            Platform: string;
            VpcConfig: string;
            AppBlockArns: string;
            EnableDefaultInternetAccess: string;
            DisplayName: string;
            IamRoleArn: string;
            InstanceType: string;
            Tags: string;
            Name: string;
            AccessEndpoints: string;
        };
        Application: {
            WorkingDirectory: string;
            Platforms: string;
            AppBlockArn: string;
            Description: string;
            InstanceFamilies: string;
            AttributesToDelete: string;
            DisplayName: string;
            LaunchPath: string;
            LaunchParameters: string;
            Tags: string;
            Name: string;
            IconS3Location: string;
        };
        ApplicationEntitlementAssociation: {
            EntitlementName: string;
            ApplicationIdentifier: string;
            StackName: string;
        };
        ApplicationFleetAssociation: {
            FleetName: string;
            ApplicationArn: string;
        };
        DirectoryConfig: {
            OrganizationalUnitDistinguishedNames: string;
            ServiceAccountCredentials: string;
            CertificateBasedAuthProperties: string;
            DirectoryName: string;
        };
        Entitlement: {
            AppVisibility: string;
            Description: string;
            Attributes: string;
            StackName: string;
            Name: string;
        };
        Fleet: {
            Description: string;
            ComputeCapacity: string;
            Platform: string;
            VpcConfig: string;
            FleetType: string;
            EnableDefaultInternetAccess: string;
            DomainJoinInfo: string;
            SessionScriptS3Location: string;
            Name: string;
            ImageName: string;
            MaxUserDurationInSeconds: string;
            IdleDisconnectTimeoutInSeconds: string;
            UsbDeviceFilterStrings: string;
            DisconnectTimeoutInSeconds: string;
            DisplayName: string;
            StreamView: string;
            IamRoleArn: string;
            MaxSessionsPerInstance: string;
            InstanceType: string;
            MaxConcurrentSessions: string;
            Tags: string;
            ImageArn: string;
        };
        ImageBuilder: {
            Description: string;
            VpcConfig: string;
            EnableDefaultInternetAccess: string;
            DomainJoinInfo: string;
            AppstreamAgentVersion: string;
            Name: string;
            ImageName: string;
            DisplayName: string;
            IamRoleArn: string;
            InstanceType: string;
            Tags: string;
            ImageArn: string;
            AccessEndpoints: string;
        };
        Stack: {
            Description: string;
            StorageConnectors: string;
            DeleteStorageConnectors: string;
            EmbedHostDomains: string;
            UserSettings: string;
            AttributesToDelete: string;
            RedirectURL: string;
            StreamingExperienceSettings: string;
            Name: string;
            FeedbackURL: string;
            ApplicationSettings: string;
            DisplayName: string;
            Tags: string;
            AccessEndpoints: string;
        };
        StackFleetAssociation: {
            FleetName: string;
            StackName: string;
        };
        StackUserAssociation: {
            SendEmailNotification: string;
            UserName: string;
            StackName: string;
            AuthenticationType: string;
        };
        User: {
            UserName: string;
            FirstName: string;
            MessageAction: string;
            LastName: string;
            AuthenticationType: string;
        };
    };
    AppSync: {
        Api: {
            OwnerContact: string;
            EventConfig: string;
            Tags: string;
            Name: string;
        };
        ApiCache: {
            Type: string;
            TransitEncryptionEnabled: string;
            HealthMetricsConfig: string;
            AtRestEncryptionEnabled: string;
            ApiId: string;
            ApiCachingBehavior: string;
            Ttl: string;
        };
        ApiKey: {
            Description: string;
            ApiKeyId: string;
            Expires: string;
            ApiId: string;
        };
        ChannelNamespace: {
            SubscribeAuthModes: string;
            CodeS3Location: string;
            PublishAuthModes: string;
            CodeHandlers: string;
            HandlerConfigs: string;
            ApiId: string;
            Tags: string;
            Name: string;
        };
        DataSource: {
            OpenSearchServiceConfig: string;
            Description: string;
            ServiceRoleArn: string;
            MetricsConfig: string;
            Name: string;
            Type: string;
            EventBridgeConfig: string;
            HttpConfig: string;
            RelationalDatabaseConfig: string;
            LambdaConfig: string;
            ApiId: string;
            DynamoDBConfig: string;
            ElasticsearchConfig: string;
        };
        DomainName: {
            Description: string;
            DomainName: string;
            Tags: string;
            CertificateArn: string;
        };
        DomainNameApiAssociation: {
            DomainName: string;
            ApiId: string;
        };
        FunctionConfiguration: {
            Description: string;
            RequestMappingTemplate: string;
            ResponseMappingTemplate: string;
            MaxBatchSize: string;
            SyncConfig: string;
            Code: string;
            Name: string;
            ResponseMappingTemplateS3Location: string;
            Runtime: string;
            CodeS3Location: string;
            DataSourceName: string;
            FunctionVersion: string;
            RequestMappingTemplateS3Location: string;
            ApiId: string;
        };
        GraphQLApi: {
            QueryDepthLimit: string;
            OpenIDConnectConfig: string;
            IntrospectionConfig: string;
            MergedApiExecutionRoleArn: string;
            EnhancedMetricsConfig: string;
            OwnerContact: string;
            ResolverCountLimit: string;
            Name: string;
            AdditionalAuthenticationProviders: string;
            EnvironmentVariables: string;
            ApiType: string;
            LambdaAuthorizerConfig: string;
            XrayEnabled: string;
            Visibility: string;
            UserPoolConfig: string;
            Tags: string;
            AuthenticationType: string;
            LogConfig: string;
        };
        GraphQLSchema: {
            Definition: string;
            DefinitionS3Location: string;
            ApiId: string;
        };
        Resolver: {
            TypeName: string;
            PipelineConfig: string;
            RequestMappingTemplate: string;
            ResponseMappingTemplate: string;
            MaxBatchSize: string;
            SyncConfig: string;
            Code: string;
            MetricsConfig: string;
            ResponseMappingTemplateS3Location: string;
            Runtime: string;
            CodeS3Location: string;
            DataSourceName: string;
            Kind: string;
            CachingConfig: string;
            RequestMappingTemplateS3Location: string;
            ApiId: string;
            FieldName: string;
        };
        SourceApiAssociation: {
            Description: string;
            SourceApiAssociationConfig: string;
            MergedApiIdentifier: string;
            SourceApiIdentifier: string;
        };
    };
    AppTest: {
        TestCase: {
            Steps: string;
            Description: string;
            Tags: string;
            Name: string;
        };
    };
    ApplicationAutoScaling: {
        ScalableTarget: {
            ScheduledActions: string;
            ResourceId: string;
            ServiceNamespace: string;
            ScalableDimension: string;
            SuspendedState: string;
            MinCapacity: string;
            RoleARN: string;
            MaxCapacity: string;
        };
        ScalingPolicy: {
            PolicyType: string;
            ResourceId: string;
            ScalingTargetId: string;
            PolicyName: string;
            ServiceNamespace: string;
            ScalableDimension: string;
            TargetTrackingScalingPolicyConfiguration: string;
            StepScalingPolicyConfiguration: string;
            PredictiveScalingPolicyConfiguration: string;
        };
    };
    ApplicationInsights: {
        Application: {
            AutoConfigurationEnabled: string;
            OpsItemSNSTopicArn: string;
            OpsCenterEnabled: string;
            CustomComponents: string;
            SNSNotificationArn: string;
            AttachMissingPermission: string;
            LogPatternSets: string;
            GroupingType: string;
            ComponentMonitoringSettings: string;
            CWEMonitorEnabled: string;
            Tags: string;
            ResourceGroupName: string;
        };
    };
    ApplicationSignals: {
        ServiceLevelObjective: {
            BurnRateConfigurations: string;
            Sli: string;
            Goal: string;
            Description: string;
            RequestBasedSli: string;
            ExclusionWindows: string;
            Tags: string;
            Name: string;
        };
    };
    Athena: {
        CapacityReservation: {
            TargetDpus: string;
            CapacityAssignmentConfiguration: string;
            Tags: string;
            Name: string;
        };
        DataCatalog: {
            Status: string;
            Type: string;
            Description: string;
            Parameters: string;
            ConnectionType: string;
            Error: string;
            Tags: string;
            Name: string;
        };
        NamedQuery: {
            WorkGroup: string;
            Description: string;
            QueryString: string;
            Database: string;
            Name: string;
        };
        PreparedStatement: {
            StatementName: string;
            WorkGroup: string;
            Description: string;
            QueryStatement: string;
        };
        WorkGroup: {
            RecursiveDeleteOption: string;
            WorkGroupConfiguration: string;
            Description: string;
            State: string;
            Tags: string;
            Name: string;
        };
    };
    AuditManager: {
        Assessment: {
            Status: string;
            AssessmentReportsDestination: string;
            Delegations: string;
            Description: string;
            Scope: string;
            AwsAccount: string;
            Roles: string;
            FrameworkId: string;
            Tags: string;
            Name: string;
        };
    };
    AutoScaling: {
        AutoScalingGroup: {
            LifecycleHookSpecificationList: string;
            LoadBalancerNames: string;
            LaunchConfigurationName: string;
            ServiceLinkedRoleARN: string;
            AvailabilityZoneImpairmentPolicy: string;
            TargetGroupARNs: string;
            Cooldown: string;
            NotificationConfigurations: string;
            DesiredCapacity: string;
            HealthCheckGracePeriod: string;
            DefaultInstanceWarmup: string;
            SkipZonalShiftValidation: string;
            NewInstancesProtectedFromScaleIn: string;
            LaunchTemplate: string;
            MixedInstancesPolicy: string;
            VPCZoneIdentifier: string;
            Tags: string;
            Context: string;
            CapacityRebalance: string;
            InstanceId: string;
            AvailabilityZones: string;
            AvailabilityZoneDistribution: string;
            MetricsCollection: string;
            InstanceMaintenancePolicy: string;
            MaxSize: string;
            MinSize: string;
            TerminationPolicies: string;
            AutoScalingGroupName: string;
            TrafficSources: string;
            DesiredCapacityType: string;
            PlacementGroup: string;
            CapacityReservationSpecification: string;
            HealthCheckType: string;
            MaxInstanceLifetime: string;
        };
        LaunchConfiguration: {
            PlacementTenancy: string;
            SecurityGroups: string;
            LaunchConfigurationName: string;
            MetadataOptions: string;
            InstanceId: string;
            UserData: string;
            ClassicLinkVPCSecurityGroups: string;
            BlockDeviceMappings: string;
            IamInstanceProfile: string;
            KernelId: string;
            AssociatePublicIpAddress: string;
            ClassicLinkVPCId: string;
            EbsOptimized: string;
            KeyName: string;
            SpotPrice: string;
            ImageId: string;
            InstanceType: string;
            RamDiskId: string;
            InstanceMonitoring: string;
        };
        LifecycleHook: {
            LifecycleHookName: string;
            LifecycleTransition: string;
            AutoScalingGroupName: string;
            HeartbeatTimeout: string;
            NotificationMetadata: string;
            DefaultResult: string;
            NotificationTargetARN: string;
            RoleARN: string;
        };
        ScalingPolicy: {
            MetricAggregationType: string;
            PolicyType: string;
            PredictiveScalingConfiguration: string;
            ScalingAdjustment: string;
            Cooldown: string;
            StepAdjustments: string;
            AutoScalingGroupName: string;
            MinAdjustmentMagnitude: string;
            TargetTrackingConfiguration: string;
            EstimatedInstanceWarmup: string;
            AdjustmentType: string;
        };
        ScheduledAction: {
            MinSize: string;
            Recurrence: string;
            TimeZone: string;
            EndTime: string;
            AutoScalingGroupName: string;
            StartTime: string;
            DesiredCapacity: string;
            MaxSize: string;
        };
        WarmPool: {
            MinSize: string;
            MaxGroupPreparedCapacity: string;
            AutoScalingGroupName: string;
            PoolState: string;
            InstanceReusePolicy: string;
        };
    };
    AutoScalingPlans: {
        ScalingPlan: {
            ApplicationSource: string;
            ScalingInstructions: string;
        };
    };
    B2BI: {
        Capability: {
            Type: string;
            Configuration: string;
            InstructionsDocuments: string;
            Tags: string;
            Name: string;
        };
        Partnership: {
            ProfileId: string;
            Email: string;
            Capabilities: string;
            Phone: string;
            CapabilityOptions: string;
            Tags: string;
            Name: string;
        };
        Profile: {
            Logging: string;
            Email: string;
            BusinessName: string;
            Phone: string;
            Tags: string;
            Name: string;
        };
        Transformer: {
            Status: string;
            Mapping: string;
            InputConversion: string;
            SampleDocuments: string;
            OutputConversion: string;
            Tags: string;
            Name: string;
        };
    };
    BCMDataExports: {
        Export: {
            Export: string;
            Tags: string;
        };
    };
    Backup: {
        BackupPlan: {
            BackupPlan: string;
            BackupPlanTags: string;
        };
        BackupSelection: {
            BackupSelection: string;
            BackupPlanId: string;
        };
        BackupVault: {
            BackupVaultTags: string;
            BackupVaultName: string;
            EncryptionKeyArn: string;
            LockConfiguration: string;
            Notifications: string;
            AccessPolicy: string;
        };
        Framework: {
            FrameworkControls: string;
            FrameworkName: string;
            FrameworkTags: string;
            FrameworkDescription: string;
        };
        LogicallyAirGappedBackupVault: {
            BackupVaultTags: string;
            BackupVaultName: string;
            MaxRetentionDays: string;
            MinRetentionDays: string;
            Notifications: string;
            AccessPolicy: string;
        };
        ReportPlan: {
            ReportSetting: string;
            ReportPlanDescription: string;
            ReportPlanName: string;
            ReportDeliveryChannel: string;
            ReportPlanTags: string;
        };
        RestoreTestingPlan: {
            ScheduleExpression: string;
            StartWindowHours: string;
            RecoveryPointSelection: string;
            RestoreTestingPlanName: string;
            ScheduleExpressionTimezone: string;
            Tags: string;
        };
        RestoreTestingSelection: {
            ProtectedResourceConditions: string;
            ProtectedResourceType: string;
            RestoreMetadataOverrides: string;
            RestoreTestingSelectionName: string;
            ProtectedResourceArns: string;
            RestoreTestingPlanName: string;
            IamRoleArn: string;
            ValidationWindowHours: string;
        };
    };
    BackupGateway: {
        Hypervisor: {
            KmsKeyArn: string;
            Username: string;
            Host: string;
            LogGroupArn: string;
            Tags: string;
            Name: string;
            Password: string;
        };
    };
    Batch: {
        ComputeEnvironment: {
            Context: string;
            UnmanagedvCpus: string;
            Type: string;
            ReplaceComputeEnvironment: string;
            ServiceRole: string;
            UpdatePolicy: string;
            EksConfiguration: string;
            ComputeEnvironmentName: string;
            ComputeResources: string;
            State: string;
            Tags: string;
        };
        ConsumableResource: {
            TotalQuantity: string;
            ConsumableResourceName: string;
            ResourceType: string;
            Tags: string;
        };
        JobDefinition: {
            Parameters: string;
            Timeout: string;
            JobDefinitionName: string;
            PropagateTags: string;
            PlatformCapabilities: string;
            EksProperties: string;
            ConsumableResourceProperties: string;
            Type: string;
            NodeProperties: string;
            SchedulingPriority: string;
            ContainerProperties: string;
            EcsProperties: string;
            RetryStrategy: string;
            Tags: string;
        };
        JobQueue: {
            ComputeEnvironmentOrder: string;
            Priority: string;
            State: string;
            JobQueueType: string;
            ServiceEnvironmentOrder: string;
            SchedulingPolicyArn: string;
            JobStateTimeLimitActions: string;
            JobQueueName: string;
            Tags: string;
        };
        SchedulingPolicy: {
            FairsharePolicy: string;
            Tags: string;
            Name: string;
        };
        ServiceEnvironment: {
            ServiceEnvironmentName: string;
            State: string;
            ServiceEnvironmentType: string;
            CapacityLimits: string;
            Tags: string;
        };
    };
    Bedrock: {
        Agent: {
            AgentCollaborators: string;
            Description: string;
            SkipResourceInUseCheckOnDelete: string;
            GuardrailConfiguration: string;
            PromptOverrideConfiguration: string;
            MemoryConfiguration: string;
            AgentCollaboration: string;
            Instruction: string;
            CustomOrchestration: string;
            TestAliasTags: string;
            AgentResourceRoleArn: string;
            OrchestrationType: string;
            IdleSessionTTLInSeconds: string;
            FoundationModel: string;
            CustomerEncryptionKeyArn: string;
            AgentName: string;
            KnowledgeBases: string;
            ActionGroups: string;
            AutoPrepare: string;
            Tags: string;
        };
        AgentAlias: {
            AgentAliasName: string;
            Description: string;
            RoutingConfiguration: string;
            AgentId: string;
            Tags: string;
        };
        ApplicationInferenceProfile: {
            Description: string;
            InferenceProfileName: string;
            ModelSource: string;
            Tags: string;
        };
        AutomatedReasoningPolicy: {
            Description: string;
            PolicyDefinition: string;
            Tags: string;
            Name: string;
        };
        AutomatedReasoningPolicyVersion: {
            LastUpdatedDefinitionHash: string;
            PolicyArn: string;
            Tags: string;
        };
        Blueprint: {
            Type: string;
            BlueprintName: string;
            KmsKeyId: string;
            Schema: string;
            KmsEncryptionContext: string;
            Tags: string;
        };
        DataAutomationProject: {
            KmsKeyId: string;
            ProjectName: string;
            StandardOutputConfiguration: string;
            OverrideConfiguration: string;
            KmsEncryptionContext: string;
            CustomOutputConfiguration: string;
            ProjectDescription: string;
            Tags: string;
        };
        DataSource: {
            DataDeletionPolicy: string;
            Description: string;
            KnowledgeBaseId: string;
            ServerSideEncryptionConfiguration: string;
            VectorIngestionConfiguration: string;
            DataSourceConfiguration: string;
            Name: string;
        };
        Flow: {
            TestAliasTags: string;
            ExecutionRoleArn: string;
            Description: string;
            DefinitionString: string;
            Definition: string;
            DefinitionSubstitutions: string;
            CustomerEncryptionKeyArn: string;
            DefinitionS3Location: string;
            Tags: string;
            Name: string;
        };
        FlowAlias: {
            Description: string;
            ConcurrencyConfiguration: string;
            RoutingConfiguration: string;
            FlowArn: string;
            Tags: string;
            Name: string;
        };
        FlowVersion: {
            Description: string;
            FlowArn: string;
        };
        Guardrail: {
            TopicPolicyConfig: string;
            Description: string;
            CrossRegionConfig: string;
            Name: string;
            WordPolicyConfig: string;
            ContextualGroundingPolicyConfig: string;
            KmsKeyArn: string;
            BlockedInputMessaging: string;
            BlockedOutputsMessaging: string;
            SensitiveInformationPolicyConfig: string;
            ContentPolicyConfig: string;
            Tags: string;
            AutomatedReasoningPolicyConfig: string;
        };
        GuardrailVersion: {
            GuardrailIdentifier: string;
            Description: string;
        };
        IntelligentPromptRouter: {
            Description: string;
            PromptRouterName: string;
            FallbackModel: string;
            RoutingCriteria: string;
            Models: string;
            Tags: string;
        };
        KnowledgeBase: {
            Description: string;
            KnowledgeBaseConfiguration: string;
            StorageConfiguration: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
        Prompt: {
            Variants: string;
            Description: string;
            CustomerEncryptionKeyArn: string;
            DefaultVariant: string;
            Tags: string;
            Name: string;
        };
        PromptVersion: {
            Description: string;
            PromptArn: string;
            Tags: string;
        };
    };
    Billing: {
        BillingView: {
            Description: string;
            SourceViews: string;
            DataFilterExpression: string;
            Tags: string;
            Name: string;
        };
    };
    BillingConductor: {
        BillingGroup: {
            Description: string;
            PrimaryAccountId: string;
            ComputationPreference: string;
            AccountGrouping: string;
            Tags: string;
            Name: string;
        };
        CustomLineItem: {
            BillingPeriodRange: string;
            Description: string;
            AccountId: string;
            BillingGroupArn: string;
            CustomLineItemChargeDetails: string;
            Tags: string;
            Name: string;
        };
        PricingPlan: {
            Description: string;
            PricingRuleArns: string;
            Tags: string;
            Name: string;
        };
        PricingRule: {
            Type: string;
            Description: string;
            Scope: string;
            Service: string;
            ModifierPercentage: string;
            Operation: string;
            Tiering: string;
            BillingEntity: string;
            UsageType: string;
            Tags: string;
            Name: string;
        };
    };
    Budgets: {
        Budget: {
            NotificationsWithSubscribers: string;
            ResourceTags: string;
            Budget: string;
        };
        BudgetsAction: {
            ExecutionRoleArn: string;
            ActionType: string;
            ResourceTags: string;
            NotificationType: string;
            ActionThreshold: string;
            Definition: string;
            ApprovalModel: string;
            Subscribers: string;
            BudgetName: string;
        };
    };
    CE: {
        AnomalyMonitor: {
            MonitorType: string;
            ResourceTags: string;
            MonitorName: string;
            MonitorSpecification: string;
            MonitorDimension: string;
        };
        AnomalySubscription: {
            MonitorArnList: string;
            ResourceTags: string;
            Frequency: string;
            SubscriptionName: string;
            Subscribers: string;
            Threshold: string;
            ThresholdExpression: string;
        };
        CostCategory: {
            DefaultValue: string;
            SplitChargeRules: string;
            RuleVersion: string;
            Rules: string;
            Tags: string;
            Name: string;
        };
    };
    CUR: {
        ReportDefinition: {
            AdditionalArtifacts: string;
            ReportName: string;
            Compression: string;
            Format: string;
            RefreshClosedReports: string;
            S3Bucket: string;
            ReportVersioning: string;
            S3Region: string;
            TimeUnit: string;
            BillingViewArn: string;
            S3Prefix: string;
            AdditionalSchemaElements: string;
        };
    };
    Cassandra: {
        Keyspace: {
            ClientSideTimestampsEnabled: string;
            KeyspaceName: string;
            ReplicationSpecification: string;
            Tags: string;
        };
        Table: {
            ReplicaSpecifications: string;
            ClusteringKeyColumns: string;
            KeyspaceName: string;
            EncryptionSpecification: string;
            TableName: string;
            PointInTimeRecoveryEnabled: string;
            CdcSpecification: string;
            AutoScalingSpecifications: string;
            ClientSideTimestampsEnabled: string;
            PartitionKeyColumns: string;
            BillingMode: string;
            DefaultTimeToLive: string;
            RegularColumns: string;
            Tags: string;
        };
        Type: {
            TypeName: string;
            Fields: string;
            KeyspaceName: string;
        };
    };
    CertificateManager: {
        Account: {
            ExpiryEventsConfiguration: string;
        };
        Certificate: {
            CertificateAuthorityArn: string;
            CertificateExport: string;
            CertificateTransparencyLoggingPreference: string;
            DomainName: string;
            DomainValidationOptions: string;
            KeyAlgorithm: string;
            SubjectAlternativeNames: string;
            Tags: string;
            ValidationMethod: string;
        };
    };
    Chatbot: {
        CustomAction: {
            ActionName: string;
            AliasName: string;
            Definition: string;
            Attachments: string;
            Tags: string;
        };
        MicrosoftTeamsChannelConfiguration: {
            UserRoleRequired: string;
            LoggingLevel: string;
            TeamsChannelName: string;
            CustomizationResourceArns: string;
            SnsTopicArns: string;
            GuardrailPolicies: string;
            IamRoleArn: string;
            TeamId: string;
            ConfigurationName: string;
            TeamsTenantId: string;
            Tags: string;
            TeamsChannelId: string;
        };
        SlackChannelConfiguration: {
            UserRoleRequired: string;
            LoggingLevel: string;
            CustomizationResourceArns: string;
            SnsTopicArns: string;
            GuardrailPolicies: string;
            SlackWorkspaceId: string;
            SlackChannelId: string;
            IamRoleArn: string;
            ConfigurationName: string;
            Tags: string;
        };
    };
    CleanRooms: {
        AnalysisTemplate: {
            MembershipIdentifier: string;
            Description: string;
            Format: string;
            SourceMetadata: string;
            ErrorMessageConfiguration: string;
            AnalysisParameters: string;
            Schema: string;
            Source: string;
            Tags: string;
            Name: string;
        };
        Collaboration: {
            AnalyticsEngine: string;
            CreatorDisplayName: string;
            CreatorMemberAbilities: string;
            Description: string;
            CreatorMLMemberAbilities: string;
            Name: string;
            JobLogStatus: string;
            QueryLogStatus: string;
            AutoApprovedChangeTypes: string;
            CreatorPaymentConfiguration: string;
            DataEncryptionMetadata: string;
            Tags: string;
            Members: string;
        };
        ConfiguredTable: {
            SelectedAnalysisMethods: string;
            AnalysisMethod: string;
            TableReference: string;
            Description: string;
            AnalysisRules: string;
            AllowedColumns: string;
            Tags: string;
            Name: string;
        };
        ConfiguredTableAssociation: {
            MembershipIdentifier: string;
            Description: string;
            ConfiguredTableAssociationAnalysisRules: string;
            ConfiguredTableIdentifier: string;
            Tags: string;
            RoleArn: string;
            Name: string;
        };
        IdMappingTable: {
            MembershipIdentifier: string;
            Description: string;
            KmsKeyArn: string;
            InputReferenceConfig: string;
            Tags: string;
            Name: string;
        };
        IdNamespaceAssociation: {
            IdMappingConfig: string;
            MembershipIdentifier: string;
            Description: string;
            InputReferenceConfig: string;
            Tags: string;
            Name: string;
        };
        Membership: {
            CollaborationIdentifier: string;
            JobLogStatus: string;
            DefaultResultConfiguration: string;
            QueryLogStatus: string;
            DefaultJobResultConfiguration: string;
            Tags: string;
            PaymentConfiguration: string;
        };
        PrivacyBudgetTemplate: {
            PrivacyBudgetType: string;
            MembershipIdentifier: string;
            Parameters: string;
            Tags: string;
            AutoRefresh: string;
        };
    };
    CleanRoomsML: {
        TrainingDataset: {
            Description: string;
            TrainingData: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
    };
    Cloud9: {
        EnvironmentEC2: {
            Repositories: string;
            OwnerArn: string;
            Description: string;
            ConnectionType: string;
            AutomaticStopTimeMinutes: string;
            ImageId: string;
            SubnetId: string;
            InstanceType: string;
            Tags: string;
            Name: string;
        };
    };
    CloudFormation: {
        CustomResource: {
            ServiceTimeout: string;
            ServiceToken: string;
        };
        GuardHook: {
            Options: string;
            RuleLocation: string;
            HookStatus: string;
            Alias: string;
            StackFilters: string;
            TargetOperations: string;
            TargetFilters: string;
            LogBucket: string;
            ExecutionRole: string;
            FailureMode: string;
        };
        HookDefaultVersion: {
            VersionId: string;
            TypeName: string;
            TypeVersionArn: string;
        };
        HookTypeConfig: {
            TypeName: string;
            Configuration: string;
            TypeArn: string;
            ConfigurationAlias: string;
        };
        HookVersion: {
            ExecutionRoleArn: string;
            TypeName: string;
            LoggingConfig: string;
            SchemaHandlerPackage: string;
        };
        LambdaHook: {
            HookStatus: string;
            Alias: string;
            StackFilters: string;
            TargetOperations: string;
            TargetFilters: string;
            LambdaFunction: string;
            ExecutionRole: string;
            FailureMode: string;
        };
        Macro: {
            Description: string;
            FunctionName: string;
            LogGroupName: string;
            LogRoleARN: string;
            Name: string;
        };
        ModuleDefaultVersion: {
            VersionId: string;
            ModuleName: string;
            Arn: string;
        };
        ModuleVersion: {
            ModulePackage: string;
            ModuleName: string;
        };
        PublicTypeVersion: {
            TypeName: string;
            LogDeliveryBucket: string;
            Type: string;
            PublicVersionNumber: string;
            Arn: string;
        };
        Publisher: {
            AcceptTermsAndConditions: string;
            ConnectionArn: string;
        };
        ResourceDefaultVersion: {
            VersionId: string;
            TypeName: string;
            TypeVersionArn: string;
        };
        ResourceVersion: {
            ExecutionRoleArn: string;
            TypeName: string;
            LoggingConfig: string;
            SchemaHandlerPackage: string;
        };
        Stack: {
            NotificationARNs: string;
            Parameters: string;
            Tags: string;
            TemplateURL: string;
            TimeoutInMinutes: string;
        };
        StackSet: {
            Description: string;
            Parameters: string;
            StackInstancesGroup: string;
            TemplateBody: string;
            StackSetName: string;
            CallAs: string;
            OperationPreferences: string;
            TemplateURL: string;
            AutoDeployment: string;
            Capabilities: string;
            PermissionModel: string;
            AdministrationRoleARN: string;
            ExecutionRoleName: string;
            ManagedExecution: string;
            Tags: string;
        };
        TypeActivation: {
            MajorVersion: string;
            ExecutionRoleArn: string;
            TypeName: string;
            Type: string;
            PublicTypeArn: string;
            AutoUpdate: string;
            LoggingConfig: string;
            PublisherId: string;
            VersionBump: string;
            TypeNameAlias: string;
        };
        WaitCondition: {
            Count: string;
            Handle: string;
            Timeout: string;
        };
    };
    CloudFront: {
        AnycastIpList: {
            IpCount: string;
            Tags: string;
            Name: string;
        };
        CachePolicy: {
            CachePolicyConfig: string;
        };
        CloudFrontOriginAccessIdentity: {
            CloudFrontOriginAccessIdentityConfig: string;
        };
        ConnectionGroup: {
            Ipv6Enabled: string;
            AnycastIpListId: string;
            Enabled: string;
            Tags: string;
            Name: string;
        };
        ContinuousDeploymentPolicy: {
            ContinuousDeploymentPolicyConfig: string;
        };
        Distribution: {
            DistributionConfig: string;
            Tags: string;
        };
        DistributionTenant: {
            Domains: string;
            Parameters: string;
            Customizations: string;
            Enabled: string;
            ManagedCertificateRequest: string;
            DistributionId: string;
            ConnectionGroupId: string;
            Tags: string;
            Name: string;
        };
        Function: {
            FunctionConfig: string;
            FunctionMetadata: string;
            AutoPublish: string;
            FunctionCode: string;
            Name: string;
        };
        KeyGroup: {
            KeyGroupConfig: string;
        };
        KeyValueStore: {
            Comment: string;
            ImportSource: string;
            Name: string;
        };
        MonitoringSubscription: {
            MonitoringSubscription: string;
            DistributionId: string;
        };
        OriginAccessControl: {
            OriginAccessControlConfig: string;
        };
        OriginRequestPolicy: {
            OriginRequestPolicyConfig: string;
        };
        PublicKey: {
            PublicKeyConfig: string;
        };
        RealtimeLogConfig: {
            Fields: string;
            EndPoints: string;
            SamplingRate: string;
            Name: string;
        };
        ResponseHeadersPolicy: {
            ResponseHeadersPolicyConfig: string;
        };
        StreamingDistribution: {
            StreamingDistributionConfig: string;
            Tags: string;
        };
        VpcOrigin: {
            VpcOriginEndpointConfig: string;
            Tags: string;
        };
    };
    CloudTrail: {
        Channel: {
            Destinations: string;
            Source: string;
            Tags: string;
            Name: string;
        };
        Dashboard: {
            Widgets: string;
            TerminationProtectionEnabled: string;
            RefreshSchedule: string;
            Tags: string;
            Name: string;
        };
        EventDataStore: {
            MaxEventSize: string;
            KmsKeyId: string;
            AdvancedEventSelectors: string;
            TerminationProtectionEnabled: string;
            MultiRegionEnabled: string;
            RetentionPeriod: string;
            FederationEnabled: string;
            IngestionEnabled: string;
            Name: string;
            InsightSelectors: string;
            OrganizationEnabled: string;
            FederationRoleArn: string;
            InsightsDestination: string;
            BillingMode: string;
            ContextKeySelectors: string;
            Tags: string;
        };
        ResourcePolicy: {
            ResourceArn: string;
            ResourcePolicy: string;
        };
        Trail: {
            IncludeGlobalServiceEvents: string;
            EventSelectors: string;
            KMSKeyId: string;
            CloudWatchLogsRoleArn: string;
            S3KeyPrefix: string;
            AdvancedEventSelectors: string;
            TrailName: string;
            IsOrganizationTrail: string;
            InsightSelectors: string;
            CloudWatchLogsLogGroupArn: string;
            SnsTopicName: string;
            IsMultiRegionTrail: string;
            S3BucketName: string;
            EnableLogFileValidation: string;
            Tags: string;
            IsLogging: string;
        };
    };
    CloudWatch: {
        Alarm: {
            ThresholdMetricId: string;
            EvaluateLowSampleCountPercentile: string;
            ExtendedStatistic: string;
            ComparisonOperator: string;
            TreatMissingData: string;
            Dimensions: string;
            Period: string;
            EvaluationPeriods: string;
            Unit: string;
            Namespace: string;
            OKActions: string;
            AlarmActions: string;
            MetricName: string;
            ActionsEnabled: string;
            Metrics: string;
            AlarmDescription: string;
            AlarmName: string;
            Statistic: string;
            InsufficientDataActions: string;
            DatapointsToAlarm: string;
            Tags: string;
            Threshold: string;
        };
        AnomalyDetector: {
            MetricCharacteristics: string;
            MetricName: string;
            Stat: string;
            Configuration: string;
            MetricMathAnomalyDetector: string;
            Dimensions: string;
            Namespace: string;
            SingleMetricAnomalyDetector: string;
        };
        CompositeAlarm: {
            AlarmActions: string;
            ActionsSuppressorWaitPeriod: string;
            ActionsEnabled: string;
            AlarmName: string;
            AlarmDescription: string;
            ActionsSuppressor: string;
            AlarmRule: string;
            InsufficientDataActions: string;
            OKActions: string;
            ActionsSuppressorExtensionPeriod: string;
            Tags: string;
        };
        Dashboard: {
            DashboardName: string;
            DashboardBody: string;
        };
        InsightRule: {
            RuleState: string;
            RuleBody: string;
            ApplyOnTransformedLogs: string;
            RuleName: string;
            Tags: string;
        };
        MetricStream: {
            StatisticsConfigurations: string;
            FirehoseArn: string;
            IncludeLinkedAccountsMetrics: string;
            IncludeFilters: string;
            OutputFormat: string;
            ExcludeFilters: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
    };
    CodeArtifact: {
        Domain: {
            PermissionsPolicyDocument: string;
            DomainName: string;
            Tags: string;
            EncryptionKey: string;
        };
        PackageGroup: {
            Pattern: string;
            Description: string;
            DomainName: string;
            OriginConfiguration: string;
            ContactInfo: string;
            DomainOwner: string;
            Tags: string;
        };
        Repository: {
            Description: string;
            PermissionsPolicyDocument: string;
            DomainName: string;
            Upstreams: string;
            RepositoryName: string;
            ExternalConnections: string;
            Tags: string;
            DomainOwner: string;
        };
    };
    CodeBuild: {
        Fleet: {
            FleetServiceRole: string;
            EnvironmentType: string;
            OverflowBehavior: string;
            ImageId: string;
            ScalingConfiguration: string;
            BaseCapacity: string;
            FleetProxyConfiguration: string;
            ComputeConfiguration: string;
            ComputeType: string;
            Tags: string;
            Name: string;
            FleetVpcConfig: string;
        };
        Project: {
            Description: string;
            ResourceAccessRole: string;
            VpcConfig: string;
            SecondarySources: string;
            EncryptionKey: string;
            SecondaryArtifacts: string;
            Source: string;
            Name: string;
            LogsConfig: string;
            ServiceRole: string;
            QueuedTimeoutInMinutes: string;
            SecondarySourceVersions: string;
            Tags: string;
            AutoRetryLimit: string;
            SourceVersion: string;
            Triggers: string;
            Artifacts: string;
            BadgeEnabled: string;
            FileSystemLocations: string;
            Environment: string;
            ConcurrentBuildLimit: string;
            Visibility: string;
            BuildBatchConfig: string;
            TimeoutInMinutes: string;
            Cache: string;
        };
        ReportGroup: {
            Type: string;
            ExportConfig: string;
            DeleteReports: string;
            Tags: string;
            Name: string;
        };
        SourceCredential: {
            ServerType: string;
            Username: string;
            Token: string;
            AuthType: string;
        };
    };
    CodeCommit: {
        Repository: {
            KmsKeyId: string;
            RepositoryName: string;
            Triggers: string;
            Code: string;
            RepositoryDescription: string;
            Tags: string;
        };
    };
    CodeConnections: {
        Connection: {
            ConnectionName: string;
            HostArn: string;
            ProviderType: string;
            Tags: string;
        };
    };
    CodeDeploy: {
        Application: {
            ApplicationName: string;
            ComputePlatform: string;
            Tags: string;
        };
        DeploymentConfig: {
            ComputePlatform: string;
            ZonalConfig: string;
            DeploymentConfigName: string;
            TrafficRoutingConfig: string;
            MinimumHealthyHosts: string;
        };
        DeploymentGroup: {
            AlarmConfiguration: string;
            ApplicationName: string;
            AutoRollbackConfiguration: string;
            AutoScalingGroups: string;
            BlueGreenDeploymentConfiguration: string;
            Deployment: string;
            DeploymentConfigName: string;
            DeploymentGroupName: string;
            DeploymentStyle: string;
            ECSServices: string;
            Ec2TagFilters: string;
            Ec2TagSet: string;
            LoadBalancerInfo: string;
            OnPremisesInstanceTagFilters: string;
            OnPremisesTagSet: string;
            OutdatedInstancesStrategy: string;
            ServiceRoleArn: string;
            Tags: string;
            TerminationHookEnabled: string;
            TriggerConfigurations: string;
        };
    };
    CodeGuruProfiler: {
        ProfilingGroup: {
            AnomalyDetectionNotificationConfiguration: string;
            AgentPermissions: string;
            ComputePlatform: string;
            ProfilingGroupName: string;
            Tags: string;
        };
    };
    CodeGuruReviewer: {
        RepositoryAssociation: {
            Type: string;
            Owner: string;
            BucketName: string;
            ConnectionArn: string;
            Tags: string;
            Name: string;
        };
    };
    CodePipeline: {
        CustomActionType: {
            Category: string;
            InputArtifactDetails: string;
            Version: string;
            OutputArtifactDetails: string;
            ConfigurationProperties: string;
            Settings: string;
            Tags: string;
            Provider: string;
        };
        Pipeline: {
            Variables: string;
            ArtifactStores: string;
            ArtifactStore: string;
            DisableInboundStageTransitions: string;
            Stages: string;
            PipelineType: string;
            ExecutionMode: string;
            RestartExecutionOnUpdate: string;
            Triggers: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
        Webhook: {
            AuthenticationConfiguration: string;
            Filters: string;
            Authentication: string;
            TargetPipeline: string;
            TargetAction: string;
            Name: string;
            TargetPipelineVersion: string;
            RegisterWithThirdParty: string;
        };
    };
    CodeStar: {
        GitHubRepository: {
            EnableIssues: string;
            ConnectionArn: string;
            RepositoryName: string;
            RepositoryAccessToken: string;
            RepositoryOwner: string;
            IsPrivate: string;
            Code: string;
            RepositoryDescription: string;
        };
    };
    CodeStarConnections: {
        Connection: {
            ConnectionName: string;
            HostArn: string;
            ProviderType: string;
            Tags: string;
        };
        RepositoryLink: {
            OwnerId: string;
            EncryptionKeyArn: string;
            ConnectionArn: string;
            RepositoryName: string;
            Tags: string;
        };
        SyncConfiguration: {
            ConfigFile: string;
            ResourceName: string;
            Branch: string;
            SyncType: string;
            TriggerResourceUpdateOn: string;
            RepositoryLinkId: string;
            RoleArn: string;
            PublishDeploymentStatus: string;
        };
    };
    CodeStarNotifications: {
        NotificationRule: {
            EventTypeIds: string;
            Status: string;
            CreatedBy: string;
            DetailType: string;
            Resource: string;
            EventTypeId: string;
            TargetAddress: string;
            Targets: string;
            Tags: string;
            Name: string;
        };
    };
    Cognito: {
        IdentityPool: {
            PushSync: string;
            CognitoIdentityProviders: string;
            CognitoEvents: string;
            DeveloperProviderName: string;
            CognitoStreams: string;
            IdentityPoolName: string;
            SupportedLoginProviders: string;
            AllowUnauthenticatedIdentities: string;
            IdentityPoolTags: string;
            SamlProviderARNs: string;
            OpenIdConnectProviderARNs: string;
            AllowClassicFlow: string;
        };
        IdentityPoolPrincipalTag: {
            PrincipalTags: string;
            UseDefaults: string;
            IdentityProviderName: string;
            IdentityPoolId: string;
        };
        IdentityPoolRoleAttachment: {
            RoleMappings: string;
            IdentityPoolId: string;
            Roles: string;
        };
        LogDeliveryConfiguration: {
            UserPoolId: string;
            LogConfigurations: string;
        };
        ManagedLoginBranding: {
            UserPoolId: string;
            UseCognitoProvidedValues: string;
            Assets: string;
            ClientId: string;
            Settings: string;
            ReturnMergedResources: string;
        };
        UserPool: {
            UserPoolTags: string;
            Policies: string;
            Schema: string;
            AdminCreateUserConfig: string;
            UserPoolTier: string;
            UsernameConfiguration: string;
            UserPoolName: string;
            SmsVerificationMessage: string;
            UserAttributeUpdateSettings: string;
            EmailConfiguration: string;
            SmsConfiguration: string;
            EmailVerificationSubject: string;
            WebAuthnRelyingPartyID: string;
            EmailAuthenticationSubject: string;
            AccountRecoverySetting: string;
            VerificationMessageTemplate: string;
            MfaConfiguration: string;
            DeletionProtection: string;
            SmsAuthenticationMessage: string;
            WebAuthnUserVerification: string;
            UserPoolAddOns: string;
            EmailAuthenticationMessage: string;
            AliasAttributes: string;
            EnabledMfas: string;
            LambdaConfig: string;
            UsernameAttributes: string;
            AutoVerifiedAttributes: string;
            DeviceConfiguration: string;
            EmailVerificationMessage: string;
        };
        UserPoolClient: {
            AnalyticsConfiguration: string;
            GenerateSecret: string;
            CallbackURLs: string;
            EnablePropagateAdditionalUserContextData: string;
            IdTokenValidity: string;
            AuthSessionValidity: string;
            RefreshTokenRotation: string;
            AllowedOAuthScopes: string;
            TokenValidityUnits: string;
            ReadAttributes: string;
            AllowedOAuthFlowsUserPoolClient: string;
            DefaultRedirectURI: string;
            SupportedIdentityProviders: string;
            ClientName: string;
            UserPoolId: string;
            AllowedOAuthFlows: string;
            ExplicitAuthFlows: string;
            LogoutURLs: string;
            AccessTokenValidity: string;
            RefreshTokenValidity: string;
            WriteAttributes: string;
            PreventUserExistenceErrors: string;
            EnableTokenRevocation: string;
        };
        UserPoolDomain: {
            UserPoolId: string;
            CustomDomainConfig: string;
            Domain: string;
            ManagedLoginVersion: string;
        };
        UserPoolGroup: {
            GroupName: string;
            Description: string;
            UserPoolId: string;
            Precedence: string;
            RoleArn: string;
        };
        UserPoolIdentityProvider: {
            ProviderName: string;
            UserPoolId: string;
            AttributeMapping: string;
            ProviderDetails: string;
            ProviderType: string;
            IdpIdentifiers: string;
        };
        UserPoolResourceServer: {
            UserPoolId: string;
            Identifier: string;
            Scopes: string;
            Name: string;
        };
        UserPoolRiskConfigurationAttachment: {
            CompromisedCredentialsRiskConfiguration: string;
            UserPoolId: string;
            ClientId: string;
            AccountTakeoverRiskConfiguration: string;
            RiskExceptionConfiguration: string;
        };
        UserPoolUICustomizationAttachment: {
            CSS: string;
            UserPoolId: string;
            ClientId: string;
        };
        UserPoolUser: {
            ValidationData: string;
            UserPoolId: string;
            Username: string;
            MessageAction: string;
            ClientMetadata: string;
            DesiredDeliveryMediums: string;
            ForceAliasCreation: string;
            UserAttributes: string;
        };
        UserPoolUserToGroupAttachment: {
            GroupName: string;
            UserPoolId: string;
            Username: string;
        };
    };
    Comprehend: {
        DocumentClassifier: {
            LanguageCode: string;
            DataAccessRoleArn: string;
            OutputDataConfig: string;
            VpcConfig: string;
            DocumentClassifierName: string;
            Mode: string;
            VolumeKmsKeyId: string;
            ModelKmsKeyId: string;
            VersionName: string;
            ModelPolicy: string;
            InputDataConfig: string;
            Tags: string;
        };
        Flywheel: {
            DataLakeS3Uri: string;
            DataAccessRoleArn: string;
            FlywheelName: string;
            ModelType: string;
            TaskConfig: string;
            ActiveModelArn: string;
            DataSecurityConfig: string;
            Tags: string;
        };
    };
    Config: {
        AggregationAuthorization: {
            AuthorizedAccountId: string;
            AuthorizedAwsRegion: string;
            Tags: string;
        };
        ConfigRule: {
            EvaluationModes: string;
            Description: string;
            Scope: string;
            Compliance: string;
            ConfigRuleName: string;
            MaximumExecutionFrequency: string;
            Source: string;
            InputParameters: string;
        };
        ConfigurationAggregator: {
            AccountAggregationSources: string;
            ConfigurationAggregatorName: string;
            OrganizationAggregationSource: string;
            Tags: string;
        };
        ConfigurationRecorder: {
            Name: string;
            RecordingGroup: string;
            RecordingMode: string;
            RoleARN: string;
        };
        ConformancePack: {
            ConformancePackInputParameters: string;
            TemplateSSMDocumentDetails: string;
            DeliveryS3Bucket: string;
            ConformancePackName: string;
            DeliveryS3KeyPrefix: string;
            TemplateBody: string;
            TemplateS3Uri: string;
        };
        DeliveryChannel: {
            ConfigSnapshotDeliveryProperties: string;
            Name: string;
            S3BucketName: string;
            S3KeyPrefix: string;
            S3KmsKeyArn: string;
            SnsTopicARN: string;
        };
        OrganizationConfigRule: {
            OrganizationManagedRuleMetadata: string;
            OrganizationConfigRuleName: string;
            OrganizationCustomRuleMetadata: string;
            ExcludedAccounts: string;
            OrganizationCustomPolicyRuleMetadata: string;
        };
        OrganizationConformancePack: {
            ConformancePackInputParameters: string;
            DeliveryS3Bucket: string;
            ExcludedAccounts: string;
            DeliveryS3KeyPrefix: string;
            TemplateBody: string;
            OrganizationConformancePackName: string;
            TemplateS3Uri: string;
        };
        RemediationConfiguration: {
            TargetVersion: string;
            ExecutionControls: string;
            Parameters: string;
            TargetType: string;
            ConfigRuleName: string;
            ResourceType: string;
            RetryAttemptSeconds: string;
            MaximumAutomaticAttempts: string;
            TargetId: string;
            Automatic: string;
        };
        StoredQuery: {
            QueryDescription: string;
            QueryExpression: string;
            Tags: string;
            QueryName: string;
        };
    };
    Connect: {
        AgentStatus: {
            ResetOrderNumber: string;
            Type: string;
            Description: string;
            DisplayOrder: string;
            State: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
        };
        ApprovedOrigin: {
            Origin: string;
            InstanceId: string;
        };
        ContactFlow: {
            Type: string;
            Description: string;
            Content: string;
            State: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
        };
        ContactFlowModule: {
            Description: string;
            Content: string;
            State: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
        };
        ContactFlowVersion: {
            Description: string;
            ContactFlowId: string;
        };
        EmailAddress: {
            Description: string;
            InstanceArn: string;
            DisplayName: string;
            EmailAddress: string;
            Tags: string;
        };
        EvaluationForm: {
            ScoringStrategy: string;
            Status: string;
            AutoEvaluationConfiguration: string;
            Description: string;
            InstanceArn: string;
            Title: string;
            Items: string;
            Tags: string;
        };
        HoursOfOperation: {
            TimeZone: string;
            Description: string;
            Config: string;
            InstanceArn: string;
            Tags: string;
            HoursOfOperationOverrides: string;
            Name: string;
        };
        Instance: {
            DirectoryId: string;
            IdentityManagementType: string;
            InstanceAlias: string;
            Attributes: string;
            Tags: string;
        };
        InstanceStorageConfig: {
            KinesisStreamConfig: string;
            S3Config: string;
            StorageType: string;
            InstanceArn: string;
            ResourceType: string;
            KinesisVideoStreamConfig: string;
            KinesisFirehoseConfig: string;
        };
        IntegrationAssociation: {
            IntegrationArn: string;
            InstanceId: string;
            IntegrationType: string;
        };
        PhoneNumber: {
            Type: string;
            Description: string;
            TargetArn: string;
            Prefix: string;
            CountryCode: string;
            SourcePhoneNumberArn: string;
            Tags: string;
        };
        PredefinedAttribute: {
            AttributeConfiguration: string;
            InstanceArn: string;
            Values: string;
            Purposes: string;
            Name: string;
        };
        Prompt: {
            Description: string;
            S3Uri: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
        };
        Queue: {
            Status: string;
            HoursOfOperationArn: string;
            Description: string;
            InstanceArn: string;
            OutboundEmailConfig: string;
            QuickConnectArns: string;
            OutboundCallerConfig: string;
            MaxContacts: string;
            Tags: string;
            Name: string;
        };
        QuickConnect: {
            Description: string;
            QuickConnectConfig: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
        };
        RoutingProfile: {
            ManualAssignmentQueueConfigs: string;
            Description: string;
            MediaConcurrencies: string;
            InstanceArn: string;
            AgentAvailabilityTimer: string;
            QueueConfigs: string;
            DefaultOutboundQueueArn: string;
            Tags: string;
            Name: string;
        };
        Rule: {
            Function: string;
            TriggerEventSource: string;
            Actions: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
            PublishStatus: string;
        };
        SecurityKey: {
            InstanceId: string;
            Key: string;
        };
        SecurityProfile: {
            Description: string;
            AllowedAccessControlTags: string;
            Applications: string;
            AllowedAccessControlHierarchyGroupId: string;
            InstanceArn: string;
            Permissions: string;
            SecurityProfileName: string;
            TagRestrictedResources: string;
            Tags: string;
            HierarchyRestrictedResources: string;
        };
        TaskTemplate: {
            Status: string;
            Description: string;
            Constraints: string;
            Defaults: string;
            Fields: string;
            InstanceArn: string;
            ContactFlowArn: string;
            ClientToken: string;
            SelfAssignContactFlowArn: string;
            Tags: string;
            Name: string;
        };
        TrafficDistributionGroup: {
            Description: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
        };
        User: {
            RoutingProfileArn: string;
            Username: string;
            PhoneConfig: string;
            InstanceArn: string;
            DirectoryUserId: string;
            IdentityInfo: string;
            HierarchyGroupArn: string;
            SecurityProfileArns: string;
            Tags: string;
            UserProficiencies: string;
            Password: string;
        };
        UserHierarchyGroup: {
            InstanceArn: string;
            ParentGroupArn: string;
            Tags: string;
            Name: string;
        };
        UserHierarchyStructure: {
            UserHierarchyStructure: string;
            InstanceArn: string;
        };
        View: {
            Description: string;
            Actions: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
            Template: string;
        };
        ViewVersion: {
            ViewArn: string;
            VersionDescription: string;
            ViewContentSha256: string;
        };
    };
    ConnectCampaigns: {
        Campaign: {
            OutboundCallConfig: string;
            ConnectInstanceArn: string;
            DialerConfig: string;
            Tags: string;
            Name: string;
        };
    };
    ConnectCampaignsV2: {
        Campaign: {
            CommunicationLimitsOverride: string;
            ChannelSubtypeConfig: string;
            ConnectCampaignFlowArn: string;
            Schedule: string;
            CommunicationTimeConfig: string;
            ConnectInstanceId: string;
            Source: string;
            Tags: string;
            Name: string;
        };
    };
    ControlTower: {
        EnabledBaseline: {
            BaselineVersion: string;
            Parameters: string;
            BaselineIdentifier: string;
            TargetIdentifier: string;
            Tags: string;
        };
        EnabledControl: {
            Parameters: string;
            ControlIdentifier: string;
            TargetIdentifier: string;
            Tags: string;
        };
        LandingZone: {
            Version: string;
            Manifest: string;
            Tags: string;
        };
    };
    CustomerProfiles: {
        CalculatedAttributeDefinition: {
            UseHistoricalData: string;
            Description: string;
            AttributeDetails: string;
            Statistic: string;
            DomainName: string;
            DisplayName: string;
            CalculatedAttributeName: string;
            Conditions: string;
            Tags: string;
        };
        Domain: {
            Matching: string;
            DefaultExpirationDays: string;
            DomainName: string;
            DeadLetterQueueUrl: string;
            DefaultEncryptionKey: string;
            RuleBasedMatching: string;
            Tags: string;
        };
        EventStream: {
            DomainName: string;
            EventStreamName: string;
            Uri: string;
            Tags: string;
        };
        EventTrigger: {
            EventTriggerLimits: string;
            Description: string;
            DomainName: string;
            ObjectTypeName: string;
            SegmentFilter: string;
            EventTriggerConditions: string;
            EventTriggerName: string;
            Tags: string;
        };
        Integration: {
            EventTriggerNames: string;
            ObjectTypeNames: string;
            DomainName: string;
            ObjectTypeName: string;
            Uri: string;
            FlowDefinition: string;
            Tags: string;
        };
        ObjectType: {
            MaxProfileObjectCount: string;
            Description: string;
            Fields: string;
            DomainName: string;
            AllowProfileCreation: string;
            ObjectTypeName: string;
            Keys: string;
            SourceLastUpdatedTimestampFormat: string;
            EncryptionKey: string;
            Tags: string;
            TemplateId: string;
            ExpirationDays: string;
        };
        SegmentDefinition: {
            Description: string;
            DomainName: string;
            SegmentGroups: string;
            DisplayName: string;
            SegmentDefinitionName: string;
            Tags: string;
        };
    };
    DAX: {
        Cluster: {
            SSESpecification: string;
            Description: string;
            ReplicationFactor: string;
            ParameterGroupName: string;
            AvailabilityZones: string;
            IAMRoleARN: string;
            SubnetGroupName: string;
            PreferredMaintenanceWindow: string;
            ClusterEndpointEncryptionType: string;
            NotificationTopicARN: string;
            SecurityGroupIds: string;
            NetworkType: string;
            NodeType: string;
            ClusterName: string;
            Tags: string;
        };
        ParameterGroup: {
            ParameterNameValues: string;
            Description: string;
            ParameterGroupName: string;
        };
        SubnetGroup: {
            Description: string;
            SubnetGroupName: string;
            SubnetIds: string;
        };
    };
    DLM: {
        LifecyclePolicy: {
            ExecutionRoleArn: string;
            DefaultPolicy: string;
            CreateInterval: string;
            Description: string;
            ExtendDeletion: string;
            Exclusions: string;
            State: string;
            CrossRegionCopyTargets: string;
            PolicyDetails: string;
            Tags: string;
            RetainInterval: string;
            CopyTags: string;
        };
    };
    DMS: {
        Certificate: {
            CertificateIdentifier: string;
            CertificatePem: string;
            CertificateWallet: string;
        };
        DataMigration: {
            DataMigrationType: string;
            DataMigrationSettings: string;
            DataMigrationName: string;
            MigrationProjectIdentifier: string;
            SourceDataSettings: string;
            ServiceAccessRoleArn: string;
            Tags: string;
            DataMigrationIdentifier: string;
        };
        DataProvider: {
            DataProviderName: string;
            Description: string;
            ExactSettings: string;
            Engine: string;
            Settings: string;
            Tags: string;
            DataProviderIdentifier: string;
        };
        Endpoint: {
            SybaseSettings: string;
            RedisSettings: string;
            OracleSettings: string;
            KafkaSettings: string;
            Port: string;
            MySqlSettings: string;
            S3Settings: string;
            ResourceIdentifier: string;
            KinesisSettings: string;
            SslMode: string;
            RedshiftSettings: string;
            EndpointType: string;
            Tags: string;
            Password: string;
            MongoDbSettings: string;
            IbmDb2Settings: string;
            KmsKeyId: string;
            DatabaseName: string;
            NeptuneSettings: string;
            ElasticsearchSettings: string;
            EngineName: string;
            DocDbSettings: string;
            DynamoDbSettings: string;
            Username: string;
            MicrosoftSqlServerSettings: string;
            GcpMySQLSettings: string;
            ServerName: string;
            ExtraConnectionAttributes: string;
            EndpointIdentifier: string;
            CertificateArn: string;
            PostgreSqlSettings: string;
        };
        EventSubscription: {
            SourceType: string;
            EventCategories: string;
            Enabled: string;
            SubscriptionName: string;
            SnsTopicArn: string;
            SourceIds: string;
            Tags: string;
        };
        InstanceProfile: {
            SubnetGroupIdentifier: string;
            Description: string;
            InstanceProfileName: string;
            KmsKeyArn: string;
            NetworkType: string;
            AvailabilityZone: string;
            PubliclyAccessible: string;
            VpcSecurityGroups: string;
            Tags: string;
            InstanceProfileIdentifier: string;
        };
        MigrationProject: {
            TargetDataProviderDescriptors: string;
            MigrationProjectName: string;
            InstanceProfileName: string;
            Description: string;
            MigrationProjectIdentifier: string;
            SourceDataProviderDescriptors: string;
            TransformationRules: string;
            SchemaConversionApplicationAttributes: string;
            InstanceProfileArn: string;
            Tags: string;
            InstanceProfileIdentifier: string;
        };
        ReplicationConfig: {
            ReplicationSettings: string;
            ResourceIdentifier: string;
            ReplicationConfigIdentifier: string;
            ComputeConfig: string;
            ReplicationType: string;
            TableMappings: string;
            SourceEndpointArn: string;
            SupplementalSettings: string;
            TargetEndpointArn: string;
            Tags: string;
        };
        ReplicationInstance: {
            DnsNameServers: string;
            ReplicationInstanceIdentifier: string;
            EngineVersion: string;
            KmsKeyId: string;
            AvailabilityZone: string;
            PreferredMaintenanceWindow: string;
            AutoMinorVersionUpgrade: string;
            ReplicationSubnetGroupIdentifier: string;
            AllocatedStorage: string;
            ResourceIdentifier: string;
            VpcSecurityGroupIds: string;
            NetworkType: string;
            AllowMajorVersionUpgrade: string;
            ReplicationInstanceClass: string;
            PubliclyAccessible: string;
            MultiAZ: string;
            Tags: string;
        };
        ReplicationSubnetGroup: {
            ReplicationSubnetGroupDescription: string;
            ReplicationSubnetGroupIdentifier: string;
            SubnetIds: string;
            Tags: string;
        };
        ReplicationTask: {
            ReplicationTaskSettings: string;
            CdcStartPosition: string;
            CdcStopPosition: string;
            MigrationType: string;
            TargetEndpointArn: string;
            ReplicationInstanceArn: string;
            TaskData: string;
            CdcStartTime: string;
            ResourceIdentifier: string;
            TableMappings: string;
            ReplicationTaskIdentifier: string;
            SourceEndpointArn: string;
            Tags: string;
        };
    };
    DSQL: {
        Cluster: {
            KmsEncryptionKey: string;
            DeletionProtectionEnabled: string;
            Tags: string;
            MultiRegionProperties: string;
        };
    };
    DataBrew: {
        Dataset: {
            Input: string;
            Format: string;
            FormatOptions: string;
            Source: string;
            PathOptions: string;
            Tags: string;
            Name: string;
        };
        Job: {
            MaxRetries: string;
            ProjectName: string;
            Recipe: string;
            EncryptionKeyArn: string;
            LogSubscription: string;
            Timeout: string;
            DatabaseOutputs: string;
            OutputLocation: string;
            RoleArn: string;
            Name: string;
            Type: string;
            DatasetName: string;
            ProfileConfiguration: string;
            Outputs: string;
            ValidationConfigurations: string;
            Tags: string;
            JobSample: string;
            EncryptionMode: string;
            MaxCapacity: string;
            DataCatalogOutputs: string;
        };
        Project: {
            RecipeName: string;
            DatasetName: string;
            Sample: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
        Recipe: {
            Steps: string;
            Description: string;
            Tags: string;
            Name: string;
        };
        Ruleset: {
            Description: string;
            TargetArn: string;
            Rules: string;
            Tags: string;
            Name: string;
        };
        Schedule: {
            JobNames: string;
            CronExpression: string;
            Tags: string;
            Name: string;
        };
    };
    DataPipeline: {
        Pipeline: {
            PipelineTags: string;
            ParameterObjects: string;
            Description: string;
            Activate: string;
            PipelineObjects: string;
            ParameterValues: string;
            Name: string;
        };
    };
    DataSync: {
        Agent: {
            SubnetArns: string;
            AgentName: string;
            VpcEndpointId: string;
            ActivationKey: string;
            SecurityGroupArns: string;
            Tags: string;
        };
        LocationAzureBlob: {
            CmkSecretConfig: string;
            AzureAccessTier: string;
            Subdirectory: string;
            AzureBlobSasConfiguration: string;
            AzureBlobType: string;
            AzureBlobContainerUrl: string;
            CustomSecretConfig: string;
            AgentArns: string;
            Tags: string;
            AzureBlobAuthenticationType: string;
        };
        LocationEFS: {
            EfsFilesystemArn: string;
            Ec2Config: string;
            AccessPointArn: string;
            Subdirectory: string;
            InTransitEncryption: string;
            FileSystemAccessRoleArn: string;
            Tags: string;
        };
        LocationFSxLustre: {
            Subdirectory: string;
            FsxFilesystemArn: string;
            SecurityGroupArns: string;
            Tags: string;
        };
        LocationFSxONTAP: {
            StorageVirtualMachineArn: string;
            Subdirectory: string;
            Protocol: string;
            SecurityGroupArns: string;
            Tags: string;
        };
        LocationFSxOpenZFS: {
            Subdirectory: string;
            FsxFilesystemArn: string;
            Protocol: string;
            SecurityGroupArns: string;
            Tags: string;
        };
        LocationFSxWindows: {
            User: string;
            Subdirectory: string;
            FsxFilesystemArn: string;
            Domain: string;
            SecurityGroupArns: string;
            Tags: string;
            Password: string;
        };
        LocationHDFS: {
            KmsKeyProviderUri: string;
            QopConfiguration: string;
            KerberosPrincipal: string;
            SimpleUser: string;
            ReplicationFactor: string;
            KerberosKeytab: string;
            NameNodes: string;
            Subdirectory: string;
            KerberosKrb5Conf: string;
            BlockSize: string;
            Tags: string;
            AgentArns: string;
            AuthenticationType: string;
        };
        LocationNFS: {
            Subdirectory: string;
            ServerHostname: string;
            MountOptions: string;
            OnPremConfig: string;
            Tags: string;
        };
        LocationObjectStorage: {
            ServerCertificate: string;
            SecretKey: string;
            BucketName: string;
            CmkSecretConfig: string;
            Subdirectory: string;
            ServerHostname: string;
            AccessKey: string;
            CustomSecretConfig: string;
            ServerProtocol: string;
            AgentArns: string;
            ServerPort: string;
            Tags: string;
        };
        LocationS3: {
            S3StorageClass: string;
            S3Config: string;
            Subdirectory: string;
            S3BucketArn: string;
            Tags: string;
        };
        LocationSMB: {
            KerberosPrincipal: string;
            User: string;
            KerberosKeytab: string;
            Subdirectory: string;
            ServerHostname: string;
            KerberosKrb5Conf: string;
            Domain: string;
            DnsIpAddresses: string;
            MountOptions: string;
            AgentArns: string;
            Tags: string;
            Password: string;
            AuthenticationType: string;
        };
        Task: {
            Includes: string;
            DestinationLocationArn: string;
            Options: string;
            Schedule: string;
            CloudWatchLogGroupArn: string;
            SourceLocationArn: string;
            TaskReportConfig: string;
            Excludes: string;
            TaskMode: string;
            Tags: string;
            Name: string;
            ManifestConfig: string;
        };
    };
    DataZone: {
        Connection: {
            Description: string;
            EnvironmentIdentifier: string;
            Props: string;
            AwsLocation: string;
            Name: string;
            DomainIdentifier: string;
        };
        DataSource: {
            ProjectIdentifier: string;
            PublishOnImport: string;
            Description: string;
            EnvironmentIdentifier: string;
            Configuration: string;
            AssetFormsInput: string;
            Recommendation: string;
            Name: string;
            Type: string;
            EnableSetting: string;
            ConnectionIdentifier: string;
            Schedule: string;
            DomainIdentifier: string;
        };
        Domain: {
            DomainExecutionRole: string;
            KmsKeyIdentifier: string;
            Description: string;
            ServiceRole: string;
            DomainVersion: string;
            Tags: string;
            Name: string;
            SingleSignOn: string;
        };
        DomainUnit: {
            Description: string;
            ParentDomainUnitIdentifier: string;
            DomainIdentifier: string;
            Name: string;
        };
        Environment: {
            ProjectIdentifier: string;
            EnvironmentAccountRegion: string;
            UserParameters: string;
            EnvironmentRoleArn: string;
            Description: string;
            EnvironmentProfileIdentifier: string;
            GlossaryTerms: string;
            EnvironmentAccountIdentifier: string;
            Name: string;
            DomainIdentifier: string;
        };
        EnvironmentActions: {
            Description: string;
            EnvironmentIdentifier: string;
            Identifier: string;
            Parameters: string;
            DomainIdentifier: string;
            Name: string;
        };
        EnvironmentBlueprintConfiguration: {
            RegionalParameters: string;
            ProvisioningRoleArn: string;
            ProvisioningConfigurations: string;
            EnabledRegions: string;
            EnvironmentBlueprintIdentifier: string;
            DomainIdentifier: string;
            EnvironmentRolePermissionBoundary: string;
            ManageAccessRoleArn: string;
        };
        EnvironmentProfile: {
            ProjectIdentifier: string;
            UserParameters: string;
            Description: string;
            AwsAccountRegion: string;
            AwsAccountId: string;
            EnvironmentBlueprintIdentifier: string;
            Name: string;
            DomainIdentifier: string;
        };
        GroupProfile: {
            Status: string;
            DomainIdentifier: string;
            GroupIdentifier: string;
        };
        Owner: {
            EntityType: string;
            Owner: string;
            EntityIdentifier: string;
            DomainIdentifier: string;
        };
        PolicyGrant: {
            EntityType: string;
            PolicyType: string;
            EntityIdentifier: string;
            Detail: string;
            Principal: string;
            DomainIdentifier: string;
        };
        Project: {
            DomainUnitId: string;
            ProjectProfileId: string;
            UserParameters: string;
            Description: string;
            GlossaryTerms: string;
            ProjectProfileVersion: string;
            Name: string;
            DomainIdentifier: string;
        };
        ProjectMembership: {
            ProjectIdentifier: string;
            Designation: string;
            Member: string;
            DomainIdentifier: string;
        };
        ProjectProfile: {
            Status: string;
            EnvironmentConfigurations: string;
            Description: string;
            DomainUnitIdentifier: string;
            Name: string;
            DomainIdentifier: string;
        };
        SubscriptionTarget: {
            Type: string;
            EnvironmentIdentifier: string;
            ManageAccessRole: string;
            SubscriptionTargetConfig: string;
            ApplicableAssetTypes: string;
            AuthorizedPrincipals: string;
            Name: string;
            Provider: string;
            DomainIdentifier: string;
        };
        UserProfile: {
            Status: string;
            UserIdentifier: string;
            UserType: string;
            DomainIdentifier: string;
        };
    };
    Deadline: {
        Farm: {
            Description: string;
            KmsKeyArn: string;
            DisplayName: string;
            Tags: string;
        };
        Fleet: {
            Description: string;
            Configuration: string;
            HostConfiguration: string;
            MaxWorkerCount: string;
            DisplayName: string;
            MinWorkerCount: string;
            FarmId: string;
            RoleArn: string;
            Tags: string;
        };
        LicenseEndpoint: {
            VpcId: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            Tags: string;
        };
        Limit: {
            Description: string;
            AmountRequirementName: string;
            DisplayName: string;
            MaxCount: string;
            FarmId: string;
        };
        MeteredProduct: {
            LicenseEndpointId: string;
            ProductId: string;
        };
        Monitor: {
            IdentityCenterInstanceArn: string;
            Subdomain: string;
            DisplayName: string;
            RoleArn: string;
            Tags: string;
        };
        Queue: {
            JobRunAsUser: string;
            AllowedStorageProfileIds: string;
            Description: string;
            JobAttachmentSettings: string;
            DefaultBudgetAction: string;
            DisplayName: string;
            RequiredFileSystemLocationNames: string;
            FarmId: string;
            RoleArn: string;
            Tags: string;
        };
        QueueEnvironment: {
            Priority: string;
            QueueId: string;
            TemplateType: string;
            FarmId: string;
            Template: string;
        };
        QueueFleetAssociation: {
            FleetId: string;
            QueueId: string;
            FarmId: string;
        };
        QueueLimitAssociation: {
            LimitId: string;
            QueueId: string;
            FarmId: string;
        };
        StorageProfile: {
            DisplayName: string;
            FileSystemLocations: string;
            FarmId: string;
            OsFamily: string;
        };
    };
    Detective: {
        Graph: {
            AutoEnableMembers: string;
            Tags: string;
        };
        MemberInvitation: {
            MemberId: string;
            Message: string;
            GraphArn: string;
            DisableEmailNotification: string;
            MemberEmailAddress: string;
        };
        OrganizationAdmin: {
            AccountId: string;
        };
    };
    DevOpsGuru: {
        NotificationChannel: {
            Config: string;
        };
        ResourceCollection: {
            ResourceCollectionFilter: string;
        };
    };
    DirectoryService: {
        MicrosoftAD: {
            CreateAlias: string;
            Edition: string;
            EnableSso: string;
            Name: string;
            Password: string;
            ShortName: string;
            VpcSettings: string;
        };
        SimpleAD: {
            Description: string;
            VpcSettings: string;
            Size: string;
            CreateAlias: string;
            EnableSso: string;
            ShortName: string;
            Name: string;
            Password: string;
        };
    };
    DocDB: {
        DBCluster: {
            StorageEncrypted: string;
            RestoreToTime: string;
            SnapshotIdentifier: string;
            Port: string;
            DBClusterIdentifier: string;
            PreferredBackupWindow: string;
            RotateMasterUserPassword: string;
            VpcSecurityGroupIds: string;
            NetworkType: string;
            CopyTagsToSnapshot: string;
            GlobalClusterIdentifier: string;
            RestoreType: string;
            Tags: string;
            EngineVersion: string;
            StorageType: string;
            KmsKeyId: string;
            AvailabilityZones: string;
            ServerlessV2ScalingConfiguration: string;
            PreferredMaintenanceWindow: string;
            MasterUserSecretKmsKeyId: string;
            DBSubnetGroupName: string;
            DeletionProtection: string;
            UseLatestRestorableTime: string;
            ManageMasterUserPassword: string;
            MasterUserPassword: string;
            SourceDBClusterIdentifier: string;
            MasterUsername: string;
            DBClusterParameterGroupName: string;
            BackupRetentionPeriod: string;
            EnableCloudwatchLogsExports: string;
        };
        DBClusterParameterGroup: {
            Description: string;
            Parameters: string;
            Family: string;
            Tags: string;
            Name: string;
        };
        DBInstance: {
            CACertificateIdentifier: string;
            CertificateRotationRestart: string;
            DBInstanceClass: string;
            DBClusterIdentifier: string;
            AvailabilityZone: string;
            PreferredMaintenanceWindow: string;
            EnablePerformanceInsights: string;
            AutoMinorVersionUpgrade: string;
            DBInstanceIdentifier: string;
            Tags: string;
        };
        DBSubnetGroup: {
            DBSubnetGroupName: string;
            DBSubnetGroupDescription: string;
            SubnetIds: string;
            Tags: string;
        };
        EventSubscription: {
            SourceType: string;
            Enabled: string;
            EventCategories: string;
            SubscriptionName: string;
            SnsTopicArn: string;
            SourceIds: string;
        };
    };
    DocDBElastic: {
        Cluster: {
            AdminUserName: string;
            KmsKeyId: string;
            AdminUserPassword: string;
            PreferredMaintenanceWindow: string;
            ShardInstanceCount: string;
            SubnetIds: string;
            PreferredBackupWindow: string;
            ShardCount: string;
            ShardCapacity: string;
            VpcSecurityGroupIds: string;
            ClusterName: string;
            BackupRetentionPeriod: string;
            AuthType: string;
            Tags: string;
        };
    };
    DynamoDB: {
        GlobalTable: {
            MultiRegionConsistency: string;
            SSESpecification: string;
            StreamSpecification: string;
            GlobalTableSettingsReplicationMode: string;
            WarmThroughput: string;
            Replicas: string;
            WriteProvisionedThroughputSettings: string;
            GlobalTableSourceArn: string;
            WriteOnDemandThroughputSettings: string;
            GlobalTableWitnesses: string;
            TableName: string;
            AttributeDefinitions: string;
            BillingMode: string;
            GlobalSecondaryIndexes: string;
            KeySchema: string;
            LocalSecondaryIndexes: string;
            TimeToLiveSpecification: string;
        };
        Table: {
            OnDemandThroughput: string;
            SSESpecification: string;
            KinesisStreamSpecification: string;
            StreamSpecification: string;
            ContributorInsightsSpecification: string;
            ImportSourceSpecification: string;
            GlobalTableSettingsReplicationMode: string;
            PointInTimeRecoverySpecification: string;
            ProvisionedThroughput: string;
            WarmThroughput: string;
            TableName: string;
            AttributeDefinitions: string;
            GlobalSecondaryIndexes: string;
            BillingMode: string;
            ResourcePolicy: string;
            LocalSecondaryIndexes: string;
            KeySchema: string;
            DeletionProtectionEnabled: string;
            TableClass: string;
            Tags: string;
            TimeToLiveSpecification: string;
        };
    };
    EC2: {
        CapacityReservation: {
            Tenancy: string;
            EndDateType: string;
            TagSpecifications: string;
            UnusedReservationBillingOwnerId: string;
            AvailabilityZoneId: string;
            AvailabilityZone: string;
            EndDate: string;
            EbsOptimized: string;
            OutPostArn: string;
            InstanceCount: string;
            PlacementGroupArn: string;
            InstancePlatform: string;
            InstanceType: string;
            EphemeralStorage: string;
            InstanceMatchCriteria: string;
        };
        CapacityReservationFleet: {
            Tenancy: string;
            TotalTargetCapacity: string;
            AllocationStrategy: string;
            TagSpecifications: string;
            NoRemoveEndDate: string;
            InstanceTypeSpecifications: string;
            RemoveEndDate: string;
            InstanceMatchCriteria: string;
            EndDate: string;
        };
        CarrierGateway: {
            VpcId: string;
            Tags: string;
        };
        ClientVpnAuthorizationRule: {
            ClientVpnEndpointId: string;
            Description: string;
            AccessGroupId: string;
            TargetNetworkCidr: string;
            AuthorizeAllGroups: string;
        };
        ClientVpnEndpoint: {
            ClientCidrBlock: string;
            ClientConnectOptions: string;
            Description: string;
            ClientRouteEnforcementOptions: string;
            TagSpecifications: string;
            AuthenticationOptions: string;
            ServerCertificateArn: string;
            SessionTimeoutHours: string;
            DnsServers: string;
            SecurityGroupIds: string;
            DisconnectOnSessionTimeout: string;
            ConnectionLogOptions: string;
            SplitTunnel: string;
            ClientLoginBannerOptions: string;
            VpcId: string;
            SelfServicePortal: string;
            TransportProtocol: string;
            VpnPort: string;
        };
        ClientVpnRoute: {
            ClientVpnEndpointId: string;
            TargetVpcSubnetId: string;
            Description: string;
            DestinationCidrBlock: string;
        };
        ClientVpnTargetNetworkAssociation: {
            ClientVpnEndpointId: string;
            SubnetId: string;
        };
        CustomerGateway: {
            Type: string;
            IpAddress: string;
            BgpAsnExtended: string;
            BgpAsn: string;
            Tags: string;
            CertificateArn: string;
            DeviceName: string;
        };
        DHCPOptions: {
            NetbiosNameServers: string;
            NtpServers: string;
            DomainName: string;
            Ipv6AddressPreferredLeaseTime: string;
            NetbiosNodeType: string;
            DomainNameServers: string;
            Tags: string;
        };
        EC2Fleet: {
            Context: string;
            TargetCapacitySpecification: string;
            OnDemandOptions: string;
            Type: string;
            ExcessCapacityTerminationPolicy: string;
            TagSpecifications: string;
            SpotOptions: string;
            ValidFrom: string;
            ReplaceUnhealthyInstances: string;
            LaunchTemplateConfigs: string;
            TerminateInstancesWithExpiration: string;
            ValidUntil: string;
        };
        EIP: {
            Address: string;
            InstanceId: string;
            IpamPoolId: string;
            PublicIpv4Pool: string;
            TransferAddress: string;
            Domain: string;
            Tags: string;
            NetworkBorderGroup: string;
        };
        EIPAssociation: {
            PrivateIpAddress: string;
            InstanceId: string;
            AllocationId: string;
            NetworkInterfaceId: string;
        };
        EgressOnlyInternetGateway: {
            VpcId: string;
            Tags: string;
        };
        EnclaveCertificateIamRoleAssociation: {
            RoleArn: string;
            CertificateArn: string;
        };
        FlowLog: {
            LogFormat: string;
            ResourceId: string;
            MaxAggregationInterval: string;
            DestinationOptions: string;
            ResourceType: string;
            DeliverCrossAccountRole: string;
            LogDestination: string;
            LogGroupName: string;
            DeliverLogsPermissionArn: string;
            LogDestinationType: string;
            Tags: string;
            TrafficType: string;
        };
        GatewayRouteTableAssociation: {
            RouteTableId: string;
            GatewayId: string;
        };
        Host: {
            HostRecovery: string;
            InstanceFamily: string;
            AutoPlacement: string;
            OutpostArn: string;
            HostMaintenance: string;
            AvailabilityZone: string;
            InstanceType: string;
            AssetId: string;
            Tags: string;
        };
        IPAM: {
            DefaultResourceDiscoveryOrganizationalUnitExclusions: string;
            Description: string;
            MeteredAccount: string;
            Tier: string;
            EnablePrivateGua: string;
            Tags: string;
            OperatingRegions: string;
        };
        IPAMAllocation: {
            Description: string;
            Cidr: string;
            NetmaskLength: string;
            IpamPoolId: string;
        };
        IPAMPool: {
            AwsService: string;
            Locale: string;
            PublicIpSource: string;
            Description: string;
            SourceResource: string;
            SourceIpamPoolId: string;
            AllocationMinNetmaskLength: string;
            IpamScopeId: string;
            ProvisionedCidrs: string;
            AllocationMaxNetmaskLength: string;
            AllocationDefaultNetmaskLength: string;
            AutoImport: string;
            AddressFamily: string;
            AllocationResourceTags: string;
            PubliclyAdvertisable: string;
            Tags: string;
        };
        IPAMPoolCidr: {
            Cidr: string;
            NetmaskLength: string;
            IpamPoolId: string;
        };
        IPAMResourceDiscovery: {
            OrganizationalUnitExclusions: string;
            Description: string;
            Tags: string;
            OperatingRegions: string;
        };
        IPAMResourceDiscoveryAssociation: {
            IpamId: string;
            Tags: string;
            IpamResourceDiscoveryId: string;
        };
        IPAMScope: {
            Description: string;
            IpamId: string;
            Tags: string;
        };
        Instance: {
            Tenancy: string;
            SecurityGroups: string;
            PrivateIpAddress: string;
            UserData: string;
            BlockDeviceMappings: string;
            IamInstanceProfile: string;
            Ipv6Addresses: string;
            KernelId: string;
            SubnetId: string;
            EbsOptimized: string;
            PropagateTagsToVolumeOnCreation: string;
            ElasticGpuSpecifications: string;
            ElasticInferenceAccelerators: string;
            Volumes: string;
            Ipv6AddressCount: string;
            LaunchTemplate: string;
            EnclaveOptions: string;
            NetworkInterfaces: string;
            ImageId: string;
            InstanceType: string;
            Tags: string;
            Monitoring: string;
            AdditionalInfo: string;
            HibernationOptions: string;
            LicenseSpecifications: string;
            MetadataOptions: string;
            InstanceInitiatedShutdownBehavior: string;
            CpuOptions: string;
            AvailabilityZone: string;
            PrivateDnsNameOptions: string;
            HostId: string;
            HostResourceGroupArn: string;
            SecurityGroupIds: string;
            DisableApiTermination: string;
            KeyName: string;
            RamdiskId: string;
            SourceDestCheck: string;
            PlacementGroupName: string;
            SsmAssociations: string;
            Affinity: string;
            CreditSpecification: string;
        };
        InstanceConnectEndpoint: {
            PreserveClientIp: string;
            SubnetId: string;
            ClientToken: string;
            SecurityGroupIds: string;
            Tags: string;
        };
        InternetGateway: {
            Tags: string;
        };
        IpPoolRouteTableAssociation: {
            RouteTableId: string;
            PublicIpv4Pool: string;
        };
        KeyPair: {
            KeyName: string;
            KeyType: string;
            KeyFormat: string;
            PublicKeyMaterial: string;
            Tags: string;
        };
        LaunchTemplate: {
            LaunchTemplateName: string;
            LaunchTemplateData: string;
            VersionDescription: string;
            TagSpecifications: string;
        };
        LocalGatewayRoute: {
            LocalGatewayRouteTableId: string;
            DestinationCidrBlock: string;
            NetworkInterfaceId: string;
            LocalGatewayVirtualInterfaceGroupId: string;
        };
        LocalGatewayRouteTable: {
            LocalGatewayId: string;
            Mode: string;
            Tags: string;
        };
        LocalGatewayRouteTableVPCAssociation: {
            VpcId: string;
            LocalGatewayRouteTableId: string;
            Tags: string;
        };
        LocalGatewayRouteTableVirtualInterfaceGroupAssociation: {
            LocalGatewayRouteTableId: string;
            Tags: string;
            LocalGatewayVirtualInterfaceGroupId: string;
        };
        NatGateway: {
            SecondaryAllocationIds: string;
            PrivateIpAddress: string;
            SecondaryPrivateIpAddressCount: string;
            ConnectivityType: string;
            SecondaryPrivateIpAddresses: string;
            AllocationId: string;
            SubnetId: string;
            Tags: string;
            MaxDrainDurationSeconds: string;
        };
        NetworkAcl: {
            VpcId: string;
            Tags: string;
        };
        NetworkAclEntry: {
            PortRange: string;
            NetworkAclId: string;
            RuleAction: string;
            CidrBlock: string;
            Egress: string;
            RuleNumber: string;
            Ipv6CidrBlock: string;
            Protocol: string;
            Icmp: string;
        };
        NetworkInsightsAccessScope: {
            ExcludePaths: string;
            MatchPaths: string;
            Tags: string;
        };
        NetworkInsightsAccessScopeAnalysis: {
            NetworkInsightsAccessScopeId: string;
            Tags: string;
        };
        NetworkInsightsAnalysis: {
            FilterOutArns: string;
            NetworkInsightsPathId: string;
            FilterInArns: string;
            AdditionalAccounts: string;
            Tags: string;
        };
        NetworkInsightsPath: {
            Destination: string;
            DestinationIp: string;
            SourceIp: string;
            FilterAtDestination: string;
            FilterAtSource: string;
            Protocol: string;
            DestinationPort: string;
            Source: string;
            Tags: string;
        };
        NetworkInterface: {
            Description: string;
            PrivateIpAddress: string;
            PrivateIpAddresses: string;
            SecondaryPrivateIpAddressCount: string;
            Ipv6PrefixCount: string;
            Ipv4Prefixes: string;
            Ipv4PrefixCount: string;
            GroupSet: string;
            Ipv6Addresses: string;
            Ipv6Prefixes: string;
            SubnetId: string;
            SourceDestCheck: string;
            InterfaceType: string;
            Ipv6AddressCount: string;
            Tags: string;
            ConnectionTrackingSpecification: string;
        };
        NetworkInterfaceAttachment: {
            EnaSrdSpecification: string;
            InstanceId: string;
            DeviceIndex: string;
            NetworkInterfaceId: string;
            DeleteOnTermination: string;
        };
        NetworkInterfacePermission: {
            AwsAccountId: string;
            NetworkInterfaceId: string;
            Permission: string;
        };
        NetworkPerformanceMetricSubscription: {
            Destination: string;
            Statistic: string;
            Metric: string;
            Source: string;
        };
        PlacementGroup: {
            SpreadLevel: string;
            Strategy: string;
            PartitionCount: string;
            Tags: string;
        };
        PrefixList: {
            MaxEntries: string;
            PrefixListName: string;
            Entries: string;
            AddressFamily: string;
            Tags: string;
        };
        Route: {
            DestinationIpv6CidrBlock: string;
            RouteTableId: string;
            InstanceId: string;
            LocalGatewayId: string;
            CarrierGatewayId: string;
            DestinationCidrBlock: string;
            GatewayId: string;
            NetworkInterfaceId: string;
            VpcEndpointId: string;
            CoreNetworkArn: string;
            TransitGatewayId: string;
            VpcPeeringConnectionId: string;
            EgressOnlyInternetGatewayId: string;
            DestinationPrefixListId: string;
            NatGatewayId: string;
        };
        RouteServer: {
            PersistRoutes: string;
            SnsNotificationsEnabled: string;
            PersistRoutesDuration: string;
            AmazonSideAsn: string;
            Tags: string;
        };
        RouteServerAssociation: {
            VpcId: string;
            RouteServerId: string;
        };
        RouteServerEndpoint: {
            SubnetId: string;
            RouteServerId: string;
            Tags: string;
        };
        RouteServerPeer: {
            PeerAddress: string;
            BgpOptions: string;
            RouteServerEndpointId: string;
            Tags: string;
        };
        RouteServerPropagation: {
            RouteTableId: string;
            RouteServerId: string;
        };
        RouteTable: {
            VpcId: string;
            Tags: string;
        };
        SecurityGroup: {
            GroupDescription: string;
            GroupName: string;
            VpcId: string;
            SecurityGroupIngress: string;
            SecurityGroupEgress: string;
            Tags: string;
        };
        SecurityGroupEgress: {
            CidrIp: string;
            CidrIpv6: string;
            Description: string;
            FromPort: string;
            ToPort: string;
            IpProtocol: string;
            DestinationSecurityGroupId: string;
            DestinationPrefixListId: string;
            GroupId: string;
        };
        SecurityGroupIngress: {
            GroupName: string;
            CidrIp: string;
            CidrIpv6: string;
            Description: string;
            FromPort: string;
            SourceSecurityGroupName: string;
            ToPort: string;
            SourceSecurityGroupOwnerId: string;
            IpProtocol: string;
            SourceSecurityGroupId: string;
            SourcePrefixListId: string;
            GroupId: string;
        };
        SecurityGroupVpcAssociation: {
            VpcId: string;
            GroupId: string;
        };
        SnapshotBlockPublicAccess: {
            State: string;
        };
        SpotFleet: {
            SpotFleetRequestConfigData: string;
        };
        Subnet: {
            MapPublicIpOnLaunch: string;
            EnableDns64: string;
            AvailabilityZoneId: string;
            OutpostArn: string;
            AvailabilityZone: string;
            CidrBlock: string;
            EnableLniAtDeviceIndex: string;
            Ipv6NetmaskLength: string;
            Ipv6IpamPoolId: string;
            AssignIpv6AddressOnCreation: string;
            VpcId: string;
            Ipv4NetmaskLength: string;
            PrivateDnsNameOptionsOnLaunch: string;
            Ipv4IpamPoolId: string;
            Ipv6Native: string;
            Ipv6CidrBlock: string;
            Tags: string;
        };
        SubnetCidrBlock: {
            Ipv6NetmaskLength: string;
            Ipv6IpamPoolId: string;
            SubnetId: string;
            Ipv6CidrBlock: string;
        };
        SubnetNetworkAclAssociation: {
            NetworkAclId: string;
            SubnetId: string;
        };
        SubnetRouteTableAssociation: {
            RouteTableId: string;
            SubnetId: string;
        };
        TrafficMirrorFilter: {
            Description: string;
            NetworkServices: string;
            Tags: string;
        };
        TrafficMirrorFilterRule: {
            DestinationPortRange: string;
            Description: string;
            SourcePortRange: string;
            RuleAction: string;
            SourceCidrBlock: string;
            RuleNumber: string;
            DestinationCidrBlock: string;
            TrafficMirrorFilterId: string;
            TrafficDirection: string;
            Protocol: string;
            Tags: string;
        };
        TrafficMirrorSession: {
            TrafficMirrorTargetId: string;
            Description: string;
            OwnerId: string;
            SessionNumber: string;
            VirtualNetworkId: string;
            PacketLength: string;
            NetworkInterfaceId: string;
            TrafficMirrorFilterId: string;
            Tags: string;
        };
        TrafficMirrorTarget: {
            NetworkLoadBalancerArn: string;
            Description: string;
            NetworkInterfaceId: string;
            GatewayLoadBalancerEndpointId: string;
            Tags: string;
        };
        TransitGateway: {
            Description: string;
            AssociationDefaultRouteTableId: string;
            AutoAcceptSharedAttachments: string;
            DefaultRouteTablePropagation: string;
            TransitGatewayCidrBlocks: string;
            PropagationDefaultRouteTableId: string;
            DefaultRouteTableAssociation: string;
            VpnEcmpSupport: string;
            SecurityGroupReferencingSupport: string;
            DnsSupport: string;
            MulticastSupport: string;
            AmazonSideAsn: string;
            Tags: string;
        };
        TransitGatewayAttachment: {
            Options: string;
            TransitGatewayId: string;
            VpcId: string;
            SubnetIds: string;
            Tags: string;
        };
        TransitGatewayConnect: {
            Options: string;
            TransportTransitGatewayAttachmentId: string;
            Tags: string;
        };
        TransitGatewayConnectPeer: {
            ConnectPeerConfiguration: string;
            Tags: string;
            TransitGatewayAttachmentId: string;
        };
        TransitGatewayMulticastDomain: {
            Options: string;
            TransitGatewayId: string;
            Tags: string;
        };
        TransitGatewayMulticastDomainAssociation: {
            TransitGatewayMulticastDomainId: string;
            SubnetId: string;
            TransitGatewayAttachmentId: string;
        };
        TransitGatewayMulticastGroupMember: {
            TransitGatewayMulticastDomainId: string;
            NetworkInterfaceId: string;
            GroupIpAddress: string;
        };
        TransitGatewayMulticastGroupSource: {
            TransitGatewayMulticastDomainId: string;
            NetworkInterfaceId: string;
            GroupIpAddress: string;
        };
        TransitGatewayPeeringAttachment: {
            TransitGatewayId: string;
            PeerTransitGatewayId: string;
            PeerAccountId: string;
            PeerRegion: string;
            Tags: string;
        };
        TransitGatewayRoute: {
            TransitGatewayRouteTableId: string;
            DestinationCidrBlock: string;
            Blackhole: string;
            TransitGatewayAttachmentId: string;
        };
        TransitGatewayRouteTable: {
            TransitGatewayId: string;
            Tags: string;
        };
        TransitGatewayRouteTableAssociation: {
            TransitGatewayRouteTableId: string;
            TransitGatewayAttachmentId: string;
        };
        TransitGatewayRouteTablePropagation: {
            TransitGatewayRouteTableId: string;
            TransitGatewayAttachmentId: string;
        };
        TransitGatewayVpcAttachment: {
            Options: string;
            TransitGatewayId: string;
            VpcId: string;
            RemoveSubnetIds: string;
            SubnetIds: string;
            AddSubnetIds: string;
            Tags: string;
        };
        VPC: {
            InstanceTenancy: string;
            Ipv4NetmaskLength: string;
            CidrBlock: string;
            Ipv4IpamPoolId: string;
            EnableDnsSupport: string;
            EnableDnsHostnames: string;
            Tags: string;
        };
        VPCBlockPublicAccessExclusion: {
            InternetGatewayExclusionMode: string;
            VpcId: string;
            SubnetId: string;
            Tags: string;
        };
        VPCBlockPublicAccessOptions: {
            InternetGatewayBlockMode: string;
        };
        VPCCidrBlock: {
            Ipv6NetmaskLength: string;
            Ipv6IpamPoolId: string;
            VpcId: string;
            Ipv4NetmaskLength: string;
            Ipv6CidrBlockNetworkBorderGroup: string;
            CidrBlock: string;
            Ipv6Pool: string;
            Ipv4IpamPoolId: string;
            Ipv6CidrBlock: string;
            AmazonProvidedIpv6CidrBlock: string;
        };
        VPCDHCPOptionsAssociation: {
            VpcId: string;
            DhcpOptionsId: string;
        };
        VPCEndpoint: {
            PrivateDnsEnabled: string;
            IpAddressType: string;
            ServiceRegion: string;
            DnsOptions: string;
            ResourceConfigurationArn: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            ServiceNetworkArn: string;
            VpcId: string;
            RouteTableIds: string;
            ServiceName: string;
            PolicyDocument: string;
            VpcEndpointType: string;
            Tags: string;
        };
        VPCEndpointConnectionNotification: {
            ConnectionEvents: string;
            VPCEndpointId: string;
            ConnectionNotificationArn: string;
            ServiceId: string;
        };
        VPCEndpointService: {
            NetworkLoadBalancerArns: string;
            PayerResponsibility: string;
            AcceptanceRequired: string;
            ContributorInsightsEnabled: string;
            SupportedIpAddressTypes: string;
            GatewayLoadBalancerArns: string;
            SupportedRegions: string;
            Tags: string;
        };
        VPCEndpointServicePermissions: {
            AllowedPrincipals: string;
            ServiceId: string;
        };
        VPCGatewayAttachment: {
            InternetGatewayId: string;
            VpcId: string;
            VpnGatewayId: string;
        };
        VPCPeeringConnection: {
            PeerRoleArn: string;
            VpcId: string;
            PeerVpcId: string;
            PeerRegion: string;
            PeerOwnerId: string;
            Tags: string;
        };
        VPNConnection: {
            RemoteIpv6NetworkCidr: string;
            RemoteIpv4NetworkCidr: string;
            VpnTunnelOptionsSpecifications: string;
            CustomerGatewayId: string;
            OutsideIpAddressType: string;
            StaticRoutesOnly: string;
            EnableAcceleration: string;
            TransitGatewayId: string;
            Type: string;
            LocalIpv4NetworkCidr: string;
            VpnGatewayId: string;
            PreSharedKeyStorage: string;
            TransportTransitGatewayAttachmentId: string;
            LocalIpv6NetworkCidr: string;
            TunnelInsideIpVersion: string;
            Tags: string;
        };
        VPNConnectionRoute: {
            DestinationCidrBlock: string;
            VpnConnectionId: string;
        };
        VPNGateway: {
            Type: string;
            AmazonSideAsn: string;
            Tags: string;
        };
        VPNGatewayRoutePropagation: {
            RouteTableIds: string;
            VpnGatewayId: string;
        };
        VerifiedAccessEndpoint: {
            AttachmentType: string;
            Description: string;
            DomainCertificateArn: string;
            VerifiedAccessGroupId: string;
            SecurityGroupIds: string;
            LoadBalancerOptions: string;
            ApplicationDomain: string;
            PolicyEnabled: string;
            CidrOptions: string;
            EndpointDomainPrefix: string;
            EndpointType: string;
            PolicyDocument: string;
            RdsOptions: string;
            SseSpecification: string;
            Tags: string;
            NetworkInterfaceOptions: string;
        };
        VerifiedAccessGroup: {
            Description: string;
            PolicyDocument: string;
            SseSpecification: string;
            VerifiedAccessInstanceId: string;
            Tags: string;
            PolicyEnabled: string;
        };
        VerifiedAccessInstance: {
            VerifiedAccessTrustProviders: string;
            Description: string;
            FipsEnabled: string;
            LoggingConfigurations: string;
            CidrEndpointsCustomSubDomain: string;
            VerifiedAccessTrustProviderIds: string;
            Tags: string;
        };
        VerifiedAccessTrustProvider: {
            PolicyReferenceName: string;
            DeviceOptions: string;
            NativeApplicationOidcOptions: string;
            DeviceTrustProviderType: string;
            Description: string;
            OidcOptions: string;
            TrustProviderType: string;
            SseSpecification: string;
            UserTrustProviderType: string;
            Tags: string;
        };
        Volume: {
            MultiAttachEnabled: string;
            KmsKeyId: string;
            Encrypted: string;
            Size: string;
            AutoEnableIO: string;
            OutpostArn: string;
            AvailabilityZone: string;
            Throughput: string;
            Iops: string;
            VolumeInitializationRate: string;
            SnapshotId: string;
            VolumeType: string;
            Tags: string;
        };
        VolumeAttachment: {
            VolumeId: string;
            InstanceId: string;
            Device: string;
        };
    };
    ECR: {
        PublicRepository: {
            RepositoryPolicyText: string;
            RepositoryName: string;
            RepositoryCatalogData: string;
            Tags: string;
        };
        PullThroughCacheRule: {
            UpstreamRegistryUrl: string;
            CustomRoleArn: string;
            UpstreamRepositoryPrefix: string;
            UpstreamRegistry: string;
            CredentialArn: string;
            EcrRepositoryPrefix: string;
        };
        RegistryPolicy: {
            PolicyText: string;
        };
        RegistryScanningConfiguration: {
            ScanType: string;
            Rules: string;
        };
        ReplicationConfiguration: {
            ReplicationConfiguration: string;
        };
        Repository: {
            EmptyOnDelete: string;
            ImageScanningConfiguration: string;
            ImageTagMutabilityExclusionFilters: string;
            EncryptionConfiguration: string;
            RepositoryPolicyText: string;
            LifecyclePolicy: string;
            RepositoryName: string;
            Tags: string;
            ImageTagMutability: string;
        };
        RepositoryCreationTemplate: {
            ImageTagMutabilityExclusionFilters: string;
            CustomRoleArn: string;
            Description: string;
            EncryptionConfiguration: string;
            ResourceTags: string;
            RepositoryPolicy: string;
            LifecyclePolicy: string;
            AppliedFor: string;
            Prefix: string;
            ImageTagMutability: string;
        };
    };
    ECS: {
        CapacityProvider: {
            AutoScalingGroupProvider: string;
            Tags: string;
            Name: string;
        };
        Cluster: {
            ClusterSettings: string;
            DefaultCapacityProviderStrategy: string;
            Configuration: string;
            ServiceConnectDefaults: string;
            CapacityProviders: string;
            ClusterName: string;
            Tags: string;
        };
        ClusterCapacityProviderAssociations: {
            DefaultCapacityProviderStrategy: string;
            CapacityProviders: string;
            Cluster: string;
        };
        PrimaryTaskSet: {
            TaskSetId: string;
            Cluster: string;
            Service: string;
        };
        Service: {
            PlatformVersion: string;
            PropagateTags: string;
            PlacementStrategies: string;
            ServiceRegistries: string;
            VolumeConfigurations: string;
            CapacityProviderStrategy: string;
            LaunchType: string;
            AvailabilityZoneRebalancing: string;
            SchedulingStrategy: string;
            NetworkConfiguration: string;
            Tags: string;
            ForceNewDeployment: string;
            HealthCheckGracePeriodSeconds: string;
            EnableECSManagedTags: string;
            EnableExecuteCommand: string;
            PlacementConstraints: string;
            Cluster: string;
            LoadBalancers: string;
            ServiceConnectConfiguration: string;
            DesiredCount: string;
            VpcLatticeConfigurations: string;
            DeploymentController: string;
            Role: string;
            TaskDefinition: string;
            ServiceName: string;
            DeploymentConfiguration: string;
        };
        TaskDefinition: {
            TaskRoleArn: string;
            IpcMode: string;
            Memory: string;
            PlacementConstraints: string;
            Cpu: string;
            RequiresCompatibilities: string;
            NetworkMode: string;
            PidMode: string;
            EnableFaultInjection: string;
            ExecutionRoleArn: string;
            RuntimePlatform: string;
            ProxyConfiguration: string;
            Volumes: string;
            ContainerDefinitions: string;
            Family: string;
            EphemeralStorage: string;
            Tags: string;
        };
        TaskSet: {
            PlatformVersion: string;
            TaskDefinition: string;
            ExternalId: string;
            Cluster: string;
            LoadBalancers: string;
            Service: string;
            Scale: string;
            NetworkConfiguration: string;
            ServiceRegistries: string;
            CapacityProviderStrategy: string;
            LaunchType: string;
            Tags: string;
        };
    };
    EFS: {
        AccessPoint: {
            FileSystemId: string;
            RootDirectory: string;
            ClientToken: string;
            AccessPointTags: string;
            PosixUser: string;
        };
        FileSystem: {
            KmsKeyId: string;
            PerformanceMode: string;
            Encrypted: string;
            BypassPolicyLockoutSafetyCheck: string;
            FileSystemProtection: string;
            LifecyclePolicies: string;
            ThroughputMode: string;
            FileSystemTags: string;
            ProvisionedThroughputInMibps: string;
            FileSystemPolicy: string;
            AvailabilityZoneName: string;
            ReplicationConfiguration: string;
            BackupPolicy: string;
        };
        MountTarget: {
            IpAddressType: string;
            SecurityGroups: string;
            FileSystemId: string;
            IpAddress: string;
            SubnetId: string;
            Ipv6Address: string;
        };
    };
    EKS: {
        AccessEntry: {
            Type: string;
            PrincipalArn: string;
            KubernetesGroups: string;
            Username: string;
            ClusterName: string;
            AccessPolicies: string;
            Tags: string;
        };
        Addon: {
            NamespaceConfig: string;
            PreserveOnDelete: string;
            AddonVersion: string;
            ServiceAccountRoleArn: string;
            ClusterName: string;
            AddonName: string;
            PodIdentityAssociations: string;
            ResolveConflicts: string;
            Tags: string;
            ConfigurationValues: string;
        };
        Cluster: {
            Logging: string;
            ComputeConfig: string;
            Force: string;
            StorageConfig: string;
            BootstrapSelfManagedAddons: string;
            DeletionProtection: string;
            ZonalShiftConfig: string;
            AccessConfig: string;
            EncryptionConfig: string;
            KubernetesNetworkConfig: string;
            RoleArn: string;
            Name: string;
            UpgradePolicy: string;
            RemoteNetworkConfig: string;
            Version: string;
            OutpostConfig: string;
            Tags: string;
            ResourcesVpcConfig: string;
        };
        FargateProfile: {
            Subnets: string;
            FargateProfileName: string;
            ClusterName: string;
            PodExecutionRoleArn: string;
            Selectors: string;
            Tags: string;
        };
        IdentityProviderConfig: {
            Type: string;
            ClusterName: string;
            IdentityProviderConfigName: string;
            Oidc: string;
            Tags: string;
        };
        Nodegroup: {
            UpdateConfig: string;
            ScalingConfig: string;
            Labels: string;
            Taints: string;
            CapacityType: string;
            ReleaseVersion: string;
            NodeRepairConfig: string;
            NodegroupName: string;
            NodeRole: string;
            Subnets: string;
            AmiType: string;
            ForceUpdateEnabled: string;
            Version: string;
            LaunchTemplate: string;
            RemoteAccess: string;
            DiskSize: string;
            ClusterName: string;
            InstanceTypes: string;
            Tags: string;
        };
        PodIdentityAssociation: {
            ServiceAccount: string;
            TargetRoleArn: string;
            ClusterName: string;
            DisableSessionTags: string;
            RoleArn: string;
            Namespace: string;
            Tags: string;
        };
    };
    EMR: {
        Cluster: {
            AdditionalInfo: string;
            Applications: string;
            AutoScalingRole: string;
            AutoTerminationPolicy: string;
            BootstrapActions: string;
            Configurations: string;
            CustomAmiId: string;
            EbsRootVolumeIops: string;
            EbsRootVolumeSize: string;
            EbsRootVolumeThroughput: string;
            Instances: string;
            JobFlowRole: string;
            KerberosAttributes: string;
            LogEncryptionKmsKeyId: string;
            LogUri: string;
            ManagedScalingPolicy: string;
            Name: string;
            OSReleaseLabel: string;
            PlacementGroupConfigs: string;
            ReleaseLabel: string;
            ScaleDownBehavior: string;
            SecurityConfiguration: string;
            ServiceRole: string;
            StepConcurrencyLevel: string;
            Steps: string;
            Tags: string;
            VisibleToAllUsers: string;
        };
        InstanceFleetConfig: {
            ClusterId: string;
            InstanceFleetType: string;
            InstanceTypeConfigs: string;
            LaunchSpecifications: string;
            Name: string;
            ResizeSpecifications: string;
            TargetOnDemandCapacity: string;
            TargetSpotCapacity: string;
        };
        InstanceGroupConfig: {
            AutoScalingPolicy: string;
            BidPrice: string;
            Configurations: string;
            CustomAmiId: string;
            EbsConfiguration: string;
            InstanceCount: string;
            InstanceRole: string;
            InstanceType: string;
            JobFlowId: string;
            Market: string;
            Name: string;
        };
        SecurityConfiguration: {
            SecurityConfiguration: string;
            Name: string;
        };
        Step: {
            JobFlowId: string;
            ActionOnFailure: string;
            HadoopJarStep: string;
            Name: string;
        };
        Studio: {
            WorkspaceSecurityGroupId: string;
            Description: string;
            EncryptionKeyArn: string;
            DefaultS3Location: string;
            SubnetIds: string;
            IdpAuthUrl: string;
            TrustedIdentityPropagationEnabled: string;
            Name: string;
            IdcUserAssignment: string;
            ServiceRole: string;
            VpcId: string;
            EngineSecurityGroupId: string;
            UserRole: string;
            IdpRelayStateParameterName: string;
            AuthMode: string;
            Tags: string;
            IdcInstanceArn: string;
        };
        StudioSessionMapping: {
            IdentityType: string;
            SessionPolicyArn: string;
            StudioId: string;
            IdentityName: string;
        };
        WALWorkspace: {
            WALWorkspaceName: string;
            Tags: string;
        };
    };
    EMRContainers: {
        VirtualCluster: {
            SecurityConfigurationId: string;
            ContainerProvider: string;
            Tags: string;
            Name: string;
        };
    };
    EMRServerless: {
        Application: {
            AutoStartConfiguration: string;
            Architecture: string;
            WorkerTypeSpecifications: string;
            MonitoringConfiguration: string;
            MaximumCapacity: string;
            AutoStopConfiguration: string;
            RuntimeConfiguration: string;
            Name: string;
            Type: string;
            SchedulerConfiguration: string;
            InitialCapacity: string;
            InteractiveConfiguration: string;
            ImageConfiguration: string;
            NetworkConfiguration: string;
            ReleaseLabel: string;
            IdentityCenterConfiguration: string;
            Tags: string;
        };
    };
    EVS: {
        Environment: {
            LicenseInfo: string;
            Hosts: string;
            SiteId: string;
            KmsKeyId: string;
            EnvironmentName: string;
            ConnectivityInfo: string;
            InitialVlans: string;
            ServiceAccessSecurityGroups: string;
            VpcId: string;
            TermsAccepted: string;
            VcfVersion: string;
            VcfHostnames: string;
            ServiceAccessSubnetId: string;
            Tags: string;
        };
    };
    ElastiCache: {
        CacheCluster: {
            AZMode: string;
            AutoMinorVersionUpgrade: string;
            CacheNodeType: string;
            CacheParameterGroupName: string;
            CacheSecurityGroupNames: string;
            CacheSubnetGroupName: string;
            ClusterName: string;
            Engine: string;
            EngineVersion: string;
            IpDiscovery: string;
            LogDeliveryConfigurations: string;
            NetworkType: string;
            NotificationTopicArn: string;
            NumCacheNodes: string;
            Port: string;
            PreferredAvailabilityZone: string;
            PreferredAvailabilityZones: string;
            PreferredMaintenanceWindow: string;
            SnapshotArns: string;
            SnapshotName: string;
            SnapshotRetentionLimit: string;
            SnapshotWindow: string;
            Tags: string;
            TransitEncryptionEnabled: string;
            VpcSecurityGroupIds: string;
        };
        GlobalReplicationGroup: {
            GlobalReplicationGroupIdSuffix: string;
            CacheNodeType: string;
            EngineVersion: string;
            GlobalReplicationGroupDescription: string;
            RegionalConfigurations: string;
            CacheParameterGroupName: string;
            Engine: string;
            Members: string;
            AutomaticFailoverEnabled: string;
            GlobalNodeGroupCount: string;
        };
        ParameterGroup: {
            Description: string;
            Properties: string;
            Tags: string;
            CacheParameterGroupFamily: string;
        };
        ReplicationGroup: {
            AtRestEncryptionEnabled: string;
            AuthToken: string;
            AutoMinorVersionUpgrade: string;
            AutomaticFailoverEnabled: string;
            CacheNodeType: string;
            CacheParameterGroupName: string;
            CacheSecurityGroupNames: string;
            CacheSubnetGroupName: string;
            ClusterMode: string;
            DataTieringEnabled: string;
            Engine: string;
            EngineVersion: string;
            GlobalReplicationGroupId: string;
            IpDiscovery: string;
            KmsKeyId: string;
            LogDeliveryConfigurations: string;
            MultiAZEnabled: string;
            NetworkType: string;
            NodeGroupConfiguration: string;
            NotificationTopicArn: string;
            NumCacheClusters: string;
            NumNodeGroups: string;
            Port: string;
            PreferredCacheClusterAZs: string;
            PreferredMaintenanceWindow: string;
            PrimaryClusterId: string;
            ReplicasPerNodeGroup: string;
            ReplicationGroupDescription: string;
            ReplicationGroupId: string;
            SecurityGroupIds: string;
            SnapshotArns: string;
            SnapshotName: string;
            SnapshotRetentionLimit: string;
            SnapshotWindow: string;
            SnapshottingClusterId: string;
            Tags: string;
            TransitEncryptionEnabled: string;
            TransitEncryptionMode: string;
            UserGroupIds: string;
        };
        SecurityGroup: {
            Description: string;
            Tags: string;
        };
        SecurityGroupIngress: {
            CacheSecurityGroupName: string;
            EC2SecurityGroupName: string;
            EC2SecurityGroupOwnerId: string;
        };
        ServerlessCache: {
            Description: string;
            KmsKeyId: string;
            FinalSnapshotName: string;
            UserGroupId: string;
            CacheUsageLimits: string;
            SecurityGroupIds: string;
            SnapshotArnsToRestore: string;
            SubnetIds: string;
            DailySnapshotTime: string;
            ReaderEndpoint: string;
            SnapshotRetentionLimit: string;
            Endpoint: string;
            ServerlessCacheName: string;
            MajorEngineVersion: string;
            Engine: string;
            Tags: string;
        };
        SubnetGroup: {
            Description: string;
            CacheSubnetGroupName: string;
            SubnetIds: string;
            Tags: string;
        };
        User: {
            AuthenticationMode: string;
            UserName: string;
            NoPasswordRequired: string;
            AccessString: string;
            UserId: string;
            Passwords: string;
            Engine: string;
            Tags: string;
        };
        UserGroup: {
            UserGroupId: string;
            Engine: string;
            UserIds: string;
            Tags: string;
        };
    };
    ElasticBeanstalk: {
        Application: {
            ApplicationName: string;
            Description: string;
            ResourceLifecycleConfig: string;
        };
        ApplicationVersion: {
            ApplicationName: string;
            Description: string;
            SourceBundle: string;
        };
        ConfigurationTemplate: {
            EnvironmentId: string;
            PlatformArn: string;
            ApplicationName: string;
            Description: string;
            OptionSettings: string;
            SourceConfiguration: string;
            SolutionStackName: string;
        };
        Environment: {
            PlatformArn: string;
            ApplicationName: string;
            Description: string;
            EnvironmentName: string;
            OperationsRole: string;
            Tier: string;
            OptionSettings: string;
            VersionLabel: string;
            TemplateName: string;
            SolutionStackName: string;
            CNAMEPrefix: string;
            Tags: string;
        };
    };
    ElasticLoadBalancing: {
        LoadBalancer: {
            AccessLoggingPolicy: string;
            AppCookieStickinessPolicy: string;
            AvailabilityZones: string;
            ConnectionDrainingPolicy: string;
            ConnectionSettings: string;
            CrossZone: string;
            HealthCheck: string;
            Instances: string;
            LBCookieStickinessPolicy: string;
            Listeners: string;
            LoadBalancerName: string;
            Policies: string;
            Scheme: string;
            SecurityGroups: string;
            Subnets: string;
            Tags: string;
        };
    };
    ElasticLoadBalancingV2: {
        Listener: {
            MutualAuthentication: string;
            ListenerAttributes: string;
            AlpnPolicy: string;
            SslPolicy: string;
            LoadBalancerArn: string;
            DefaultActions: string;
            Port: string;
            Certificates: string;
            Protocol: string;
        };
        ListenerCertificate: {
            Certificates: string;
            ListenerArn: string;
        };
        ListenerRule: {
            ListenerArn: string;
            Actions: string;
            Priority: string;
            Conditions: string;
        };
        LoadBalancer: {
            IpAddressType: string;
            SecurityGroups: string;
            LoadBalancerAttributes: string;
            Scheme: string;
            Name: string;
            EnableCapacityReservationProvisionStabilize: string;
            Subnets: string;
            Type: string;
            MinimumLoadBalancerCapacity: string;
            EnablePrefixForIpv6SourceNat: string;
            Ipv4IpamPoolId: string;
            EnforceSecurityGroupInboundRulesOnPrivateLinkTraffic: string;
            Tags: string;
            SubnetMappings: string;
        };
        TargetGroup: {
            IpAddressType: string;
            HealthCheckIntervalSeconds: string;
            Matcher: string;
            HealthCheckPath: string;
            Port: string;
            Targets: string;
            HealthCheckEnabled: string;
            ProtocolVersion: string;
            UnhealthyThresholdCount: string;
            HealthCheckTimeoutSeconds: string;
            Name: string;
            VpcId: string;
            HealthyThresholdCount: string;
            HealthCheckProtocol: string;
            TargetGroupAttributes: string;
            TargetType: string;
            HealthCheckPort: string;
            Protocol: string;
            Tags: string;
        };
        TrustStore: {
            CaCertificatesBundleS3Bucket: string;
            CaCertificatesBundleS3ObjectVersion: string;
            Tags: string;
            Name: string;
            CaCertificatesBundleS3Key: string;
        };
        TrustStoreRevocation: {
            RevocationContents: string;
            TrustStoreArn: string;
        };
    };
    Elasticsearch: {
        Domain: {
            AccessPolicies: string;
            AdvancedOptions: string;
            AdvancedSecurityOptions: string;
            CognitoOptions: string;
            DomainEndpointOptions: string;
            DomainName: string;
            EBSOptions: string;
            ElasticsearchClusterConfig: string;
            ElasticsearchVersion: string;
            EncryptionAtRestOptions: string;
            LogPublishingOptions: string;
            NodeToNodeEncryptionOptions: string;
            SnapshotOptions: string;
            Tags: string;
            VPCOptions: string;
        };
    };
    EntityResolution: {
        IdMappingWorkflow: {
            Description: string;
            InputSourceConfig: string;
            IdMappingTechniques: string;
            WorkflowName: string;
            OutputSourceConfig: string;
            IdMappingIncrementalRunConfig: string;
            RoleArn: string;
            Tags: string;
        };
        IdNamespace: {
            IdNamespaceName: string;
            Type: string;
            Description: string;
            InputSourceConfig: string;
            IdMappingWorkflowProperties: string;
            RoleArn: string;
            Tags: string;
        };
        MatchingWorkflow: {
            ResolutionTechniques: string;
            Description: string;
            InputSourceConfig: string;
            WorkflowName: string;
            IncrementalRunConfig: string;
            OutputSourceConfig: string;
            RoleArn: string;
            Tags: string;
        };
        PolicyStatement: {
            Condition: string;
            Action: string;
            StatementId: string;
            Effect: string;
            Arn: string;
            Principal: string;
        };
        SchemaMapping: {
            Description: string;
            MappedInputFields: string;
            SchemaName: string;
            Tags: string;
        };
    };
    EventSchemas: {
        Discoverer: {
            CrossAccount: string;
            Description: string;
            SourceArn: string;
            Tags: string;
        };
        Registry: {
            Description: string;
            RegistryName: string;
            Tags: string;
        };
        RegistryPolicy: {
            Policy: string;
            RegistryName: string;
            RevisionId: string;
        };
        Schema: {
            Type: string;
            Description: string;
            Content: string;
            RegistryName: string;
            SchemaName: string;
            Tags: string;
        };
    };
    Events: {
        ApiDestination: {
            Description: string;
            ConnectionArn: string;
            InvocationEndpoint: string;
            HttpMethod: string;
            Name: string;
            InvocationRateLimitPerSecond: string;
        };
        Archive: {
            EventPattern: string;
            KmsKeyIdentifier: string;
            Description: string;
            SourceArn: string;
            ArchiveName: string;
            RetentionDays: string;
        };
        Connection: {
            AuthParameters: string;
            KmsKeyIdentifier: string;
            Description: string;
            InvocationConnectivityParameters: string;
            AuthorizationType: string;
            Name: string;
        };
        Endpoint: {
            EventBuses: string;
            Description: string;
            ReplicationConfig: string;
            RoutingConfig: string;
            RoleArn: string;
            Name: string;
        };
        EventBus: {
            Policy: string;
            KmsKeyIdentifier: string;
            Description: string;
            EventSourceName: string;
            DeadLetterConfig: string;
            Tags: string;
            Name: string;
            LogConfig: string;
        };
        EventBusPolicy: {
            EventBusName: string;
            Condition: string;
            Action: string;
            StatementId: string;
            Statement: string;
            Principal: string;
        };
        Rule: {
            EventBusName: string;
            EventPattern: string;
            ScheduleExpression: string;
            Description: string;
            State: string;
            Targets: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
    };
    Evidently: {
        Experiment: {
            Project: string;
            RunningStatus: string;
            Description: string;
            MetricGoals: string;
            OnlineAbConfig: string;
            RemoveSegment: string;
            RandomizationSalt: string;
            Treatments: string;
            SamplingRate: string;
            Segment: string;
            Tags: string;
            Name: string;
        };
        Feature: {
            Project: string;
            Description: string;
            EvaluationStrategy: string;
            DefaultVariation: string;
            EntityOverrides: string;
            Variations: string;
            Tags: string;
            Name: string;
        };
        Launch: {
            Project: string;
            Description: string;
            ExecutionStatus: string;
            Groups: string;
            RandomizationSalt: string;
            MetricMonitors: string;
            ScheduledSplitsConfig: string;
            Tags: string;
            Name: string;
        };
        Project: {
            DataDelivery: string;
            Description: string;
            AppConfigResource: string;
            Tags: string;
            Name: string;
        };
        Segment: {
            Pattern: string;
            Description: string;
            Tags: string;
            Name: string;
        };
    };
    FIS: {
        ExperimentTemplate: {
            ExperimentReportConfiguration: string;
            Description: string;
            Actions: string;
            ExperimentOptions: string;
            StopConditions: string;
            Targets: string;
            LogConfiguration: string;
            RoleArn: string;
            Tags: string;
        };
        TargetAccountConfiguration: {
            AccountId: string;
            Description: string;
            ExperimentTemplateId: string;
            RoleArn: string;
        };
    };
    FMS: {
        NotificationChannel: {
            SnsTopicArn: string;
            SnsRoleName: string;
        };
        Policy: {
            ResourceTagLogicalOperator: string;
            ResourcesCleanUp: string;
            ResourceTags: string;
            ExcludeResourceTags: string;
            ResourceType: string;
            ResourceSetIds: string;
            SecurityServicePolicyData: string;
            RemediationEnabled: string;
            DeleteAllPolicyResources: string;
            ExcludeMap: string;
            IncludeMap: string;
            PolicyDescription: string;
            PolicyName: string;
            ResourceTypeList: string;
            Tags: string;
        };
        ResourceSet: {
            Description: string;
            ResourceTypeList: string;
            Resources: string;
            Tags: string;
            Name: string;
        };
    };
    FSx: {
        DataRepositoryAssociation: {
            FileSystemPath: string;
            DataRepositoryPath: string;
            BatchImportMetaDataOnCreate: string;
            S3: string;
            FileSystemId: string;
            ImportedFileChunkSize: string;
            Tags: string;
        };
        FileSystem: {
            StorageType: string;
            KmsKeyId: string;
            StorageCapacity: string;
            LustreConfiguration: string;
            BackupId: string;
            OntapConfiguration: string;
            SubnetIds: string;
            SecurityGroupIds: string;
            WindowsConfiguration: string;
            FileSystemTypeVersion: string;
            OpenZFSConfiguration: string;
            NetworkType: string;
            FileSystemType: string;
            Tags: string;
        };
        S3AccessPointAttachment: {
            OpenZFSConfiguration: string;
            Type: string;
            S3AccessPoint: string;
            Name: string;
        };
        Snapshot: {
            VolumeId: string;
            Tags: string;
            Name: string;
        };
        StorageVirtualMachine: {
            SvmAdminPassword: string;
            ActiveDirectoryConfiguration: string;
            RootVolumeSecurityStyle: string;
            FileSystemId: string;
            Tags: string;
            Name: string;
        };
        Volume: {
            OpenZFSConfiguration: string;
            VolumeType: string;
            BackupId: string;
            OntapConfiguration: string;
            Tags: string;
            Name: string;
        };
    };
    FinSpace: {
        Environment: {
            Description: string;
            KmsKeyId: string;
            FederationParameters: string;
            FederationMode: string;
            SuperuserParameters: string;
            Tags: string;
            Name: string;
        };
    };
    Forecast: {
        Dataset: {
            DataFrequency: string;
            DatasetName: string;
            Schema: string;
            DatasetType: string;
            Domain: string;
            EncryptionConfig: string;
            Tags: string;
        };
        DatasetGroup: {
            DatasetArns: string;
            DatasetGroupName: string;
            Domain: string;
            Tags: string;
        };
    };
    FraudDetector: {
        Detector: {
            Description: string;
            DetectorVersionStatus: string;
            EventType: string;
            DetectorId: string;
            AssociatedModels: string;
            RuleExecutionMode: string;
            Rules: string;
            Tags: string;
        };
        EntityType: {
            Description: string;
            Tags: string;
            Name: string;
        };
        EventType: {
            EntityTypes: string;
            Description: string;
            Labels: string;
            EventVariables: string;
            Tags: string;
            Name: string;
        };
        Label: {
            Description: string;
            Tags: string;
            Name: string;
        };
        List: {
            Description: string;
            VariableType: string;
            Elements: string;
            Tags: string;
            Name: string;
        };
        Outcome: {
            Description: string;
            Tags: string;
            Name: string;
        };
        Variable: {
            DefaultValue: string;
            Description: string;
            VariableType: string;
            DataType: string;
            Tags: string;
            Name: string;
            DataSource: string;
        };
    };
    GameLift: {
        Alias: {
            Description: string;
            RoutingStrategy: string;
            Tags: string;
            Name: string;
        };
        Build: {
            OperatingSystem: string;
            Version: string;
            ServerSdkVersion: string;
            StorageLocation: string;
            Tags: string;
            Name: string;
        };
        ContainerFleet: {
            ScalingPolicies: string;
            GameServerContainerGroupDefinitionName: string;
            Description: string;
            FleetRoleArn: string;
            PerInstanceContainerGroupDefinitionName: string;
            Locations: string;
            GameSessionCreationLimitPolicy: string;
            NewGameSessionProtectionPolicy: string;
            GameServerContainerGroupsPerInstance: string;
            LogConfiguration: string;
            InstanceConnectionPortRange: string;
            MetricGroups: string;
            InstanceInboundPermissions: string;
            InstanceType: string;
            Tags: string;
            DeploymentConfiguration: string;
            BillingType: string;
        };
        ContainerGroupDefinition: {
            OperatingSystem: string;
            VersionDescription: string;
            GameServerContainerDefinition: string;
            TotalMemoryLimitMebibytes: string;
            SourceVersionNumber: string;
            TotalVcpuLimit: string;
            Tags: string;
            Name: string;
            ContainerGroupType: string;
            SupportContainerDefinitions: string;
        };
        Fleet: {
            ScalingPolicies: string;
            Description: string;
            PeerVpcId: string;
            ApplyCapacity: string;
            FleetType: string;
            EC2InboundPermissions: string;
            Locations: string;
            NewGameSessionProtectionPolicy: string;
            ScriptId: string;
            ComputeType: string;
            RuntimeConfiguration: string;
            Name: string;
            PeerVpcAwsAccountId: string;
            AnywhereConfiguration: string;
            InstanceRoleARN: string;
            MetricGroups: string;
            BuildId: string;
            ResourceCreationLimitPolicy: string;
            EC2InstanceType: string;
            CertificateConfiguration: string;
            InstanceRoleCredentialsProvider: string;
            Tags: string;
        };
        GameServerGroup: {
            AutoScalingPolicy: string;
            MinSize: string;
            DeleteOption: string;
            BalancingStrategy: string;
            GameServerGroupName: string;
            LaunchTemplate: string;
            GameServerProtectionPolicy: string;
            VpcSubnets: string;
            MaxSize: string;
            InstanceDefinitions: string;
            RoleArn: string;
            Tags: string;
        };
        GameSessionQueue: {
            TimeoutInSeconds: string;
            PlayerLatencyPolicies: string;
            Destinations: string;
            NotificationTarget: string;
            FilterConfiguration: string;
            CustomEventData: string;
            Tags: string;
            Name: string;
            PriorityConfiguration: string;
        };
        Location: {
            Tags: string;
            LocationName: string;
        };
        MatchmakingConfiguration: {
            GameProperties: string;
            GameSessionData: string;
            Description: string;
            AcceptanceTimeoutSeconds: string;
            NotificationTarget: string;
            CustomEventData: string;
            Name: string;
            AdditionalPlayerCount: string;
            BackfillMode: string;
            RequestTimeoutSeconds: string;
            AcceptanceRequired: string;
            CreationTime: string;
            FlexMatchMode: string;
            RuleSetName: string;
            GameSessionQueueArns: string;
            Tags: string;
            RuleSetArn: string;
        };
        MatchmakingRuleSet: {
            RuleSetBody: string;
            Tags: string;
            Name: string;
        };
        Script: {
            Version: string;
            StorageLocation: string;
            Tags: string;
            Name: string;
        };
    };
    GlobalAccelerator: {
        Accelerator: {
            IpAddressType: string;
            IpAddresses: string;
            Enabled: string;
            Tags: string;
            Name: string;
        };
        CrossAccountAttachment: {
            Principals: string;
            Resources: string;
            Tags: string;
            Name: string;
        };
        EndpointGroup: {
            ListenerArn: string;
            PortOverrides: string;
            HealthCheckIntervalSeconds: string;
            EndpointGroupRegion: string;
            HealthCheckPath: string;
            TrafficDialPercentage: string;
            HealthCheckProtocol: string;
            ThresholdCount: string;
            HealthCheckPort: string;
            EndpointConfigurations: string;
        };
        Listener: {
            PortRanges: string;
            AcceleratorArn: string;
            Protocol: string;
            ClientAffinity: string;
        };
    };
    Glue: {
        Classifier: {
            XMLClassifier: string;
            JsonClassifier: string;
            CsvClassifier: string;
            GrokClassifier: string;
        };
        Connection: {
            ConnectionInput: string;
            CatalogId: string;
        };
        Crawler: {
            Classifiers: string;
            Description: string;
            SchemaChangePolicy: string;
            Configuration: string;
            RecrawlPolicy: string;
            DatabaseName: string;
            Targets: string;
            CrawlerSecurityConfiguration: string;
            Name: string;
            Role: string;
            LakeFormationConfiguration: string;
            Schedule: string;
            TablePrefix: string;
            Tags: string;
        };
        CustomEntityType: {
            ContextWords: string;
            RegexString: string;
            Tags: string;
            Name: string;
        };
        DataCatalogEncryptionSettings: {
            DataCatalogEncryptionSettings: string;
            CatalogId: string;
        };
        DataQualityRuleset: {
            Ruleset: string;
            Description: string;
            TargetTable: string;
            ClientToken: string;
            Tags: string;
            Name: string;
        };
        Database: {
            DatabaseName: string;
            DatabaseInput: string;
            CatalogId: string;
        };
        DevEndpoint: {
            ExtraJarsS3Path: string;
            PublicKey: string;
            NumberOfNodes: string;
            Arguments: string;
            SubnetId: string;
            PublicKeys: string;
            SecurityGroupIds: string;
            RoleArn: string;
            WorkerType: string;
            EndpointName: string;
            GlueVersion: string;
            ExtraPythonLibsS3Path: string;
            SecurityConfiguration: string;
            NumberOfWorkers: string;
            Tags: string;
        };
        Job: {
            Connections: string;
            MaxRetries: string;
            JobMode: string;
            Description: string;
            Timeout: string;
            AllocatedCapacity: string;
            JobRunQueuingEnabled: string;
            Name: string;
            Role: string;
            DefaultArguments: string;
            NotificationProperty: string;
            WorkerType: string;
            ExecutionClass: string;
            LogUri: string;
            Command: string;
            GlueVersion: string;
            ExecutionProperty: string;
            SecurityConfiguration: string;
            MaintenanceWindow: string;
            NumberOfWorkers: string;
            Tags: string;
            MaxCapacity: string;
            NonOverridableArguments: string;
        };
        MLTransform: {
            MaxRetries: string;
            Description: string;
            TransformEncryption: string;
            Timeout: string;
            Name: string;
            Role: string;
            WorkerType: string;
            GlueVersion: string;
            TransformParameters: string;
            InputRecordTables: string;
            NumberOfWorkers: string;
            Tags: string;
            MaxCapacity: string;
        };
        Partition: {
            TableName: string;
            DatabaseName: string;
            CatalogId: string;
            PartitionInput: string;
        };
        Registry: {
            Description: string;
            Tags: string;
            Name: string;
        };
        Schema: {
            SchemaDefinition: string;
            Description: string;
            DataFormat: string;
            Registry: string;
            Compatibility: string;
            Tags: string;
            Name: string;
            CheckpointVersion: string;
        };
        SchemaVersion: {
            SchemaDefinition: string;
            Schema: string;
        };
        SchemaVersionMetadata: {
            SchemaVersionId: string;
            Value: string;
            Key: string;
        };
        SecurityConfiguration: {
            EncryptionConfiguration: string;
            Name: string;
        };
        Table: {
            TableInput: string;
            OpenTableFormatInput: string;
            DatabaseName: string;
            CatalogId: string;
        };
        TableOptimizer: {
            TableName: string;
            Type: string;
            DatabaseName: string;
            TableOptimizerConfiguration: string;
            CatalogId: string;
        };
        Trigger: {
            Type: string;
            StartOnCreation: string;
            Description: string;
            Actions: string;
            EventBatchingCondition: string;
            WorkflowName: string;
            Schedule: string;
            Tags: string;
            Name: string;
            Predicate: string;
        };
        UsageProfile: {
            Description: string;
            Configuration: string;
            Tags: string;
            Name: string;
        };
        Workflow: {
            Description: string;
            DefaultRunProperties: string;
            Tags: string;
            Name: string;
            MaxConcurrentRuns: string;
        };
    };
    Grafana: {
        Workspace: {
            NotificationDestinations: string;
            PluginAdminEnabled: string;
            Description: string;
            PermissionType: string;
            AccountAccessType: string;
            StackSetName: string;
            SamlConfiguration: string;
            OrganizationalUnits: string;
            RoleArn: string;
            Name: string;
            GrafanaVersion: string;
            DataSources: string;
            AuthenticationProviders: string;
            OrganizationRoleName: string;
            VpcConfiguration: string;
            NetworkAccessControl: string;
            ClientToken: string;
        };
    };
    Greengrass: {
        ConnectorDefinition: {
            InitialVersion: string;
            Tags: string;
            Name: string;
        };
        ConnectorDefinitionVersion: {
            Connectors: string;
            ConnectorDefinitionId: string;
        };
        CoreDefinition: {
            InitialVersion: string;
            Tags: string;
            Name: string;
        };
        CoreDefinitionVersion: {
            Cores: string;
            CoreDefinitionId: string;
        };
        DeviceDefinition: {
            InitialVersion: string;
            Tags: string;
            Name: string;
        };
        DeviceDefinitionVersion: {
            DeviceDefinitionId: string;
            Devices: string;
        };
        FunctionDefinition: {
            InitialVersion: string;
            Tags: string;
            Name: string;
        };
        FunctionDefinitionVersion: {
            DefaultConfig: string;
            Functions: string;
            FunctionDefinitionId: string;
        };
        Group: {
            InitialVersion: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
        GroupVersion: {
            LoggerDefinitionVersionArn: string;
            DeviceDefinitionVersionArn: string;
            FunctionDefinitionVersionArn: string;
            CoreDefinitionVersionArn: string;
            ResourceDefinitionVersionArn: string;
            ConnectorDefinitionVersionArn: string;
            SubscriptionDefinitionVersionArn: string;
            GroupId: string;
        };
        LoggerDefinition: {
            InitialVersion: string;
            Tags: string;
            Name: string;
        };
        LoggerDefinitionVersion: {
            LoggerDefinitionId: string;
            Loggers: string;
        };
        ResourceDefinition: {
            InitialVersion: string;
            Tags: string;
            Name: string;
        };
        ResourceDefinitionVersion: {
            Resources: string;
            ResourceDefinitionId: string;
        };
        SubscriptionDefinition: {
            InitialVersion: string;
            Tags: string;
            Name: string;
        };
        SubscriptionDefinitionVersion: {
            SubscriptionDefinitionId: string;
            Subscriptions: string;
        };
    };
    GreengrassV2: {
        ComponentVersion: {
            LambdaFunction: string;
            InlineRecipe: string;
            Tags: string;
        };
        Deployment: {
            Components: string;
            DeploymentName: string;
            IotJobConfiguration: string;
            DeploymentPolicies: string;
            TargetArn: string;
            ParentTargetArn: string;
            Tags: string;
        };
    };
    GroundStation: {
        Config: {
            ConfigData: string;
            Tags: string;
            Name: string;
        };
        DataflowEndpointGroup: {
            ContactPostPassDurationSeconds: string;
            EndpointDetails: string;
            Tags: string;
            ContactPrePassDurationSeconds: string;
        };
        MissionProfile: {
            StreamsKmsKey: string;
            ContactPostPassDurationSeconds: string;
            MinimumViableContactDurationSeconds: string;
            DataflowEdges: string;
            StreamsKmsRole: string;
            TrackingConfigArn: string;
            Tags: string;
            Name: string;
            ContactPrePassDurationSeconds: string;
        };
    };
    GuardDuty: {
        Detector: {
            FindingPublishingFrequency: string;
            DataSources: string;
            Enable: string;
            Features: string;
            Tags: string;
        };
        Filter: {
            Action: string;
            Description: string;
            DetectorId: string;
            FindingCriteria: string;
            Rank: string;
            Tags: string;
            Name: string;
        };
        IPSet: {
            Format: string;
            Activate: string;
            DetectorId: string;
            ExpectedBucketOwner: string;
            Tags: string;
            Name: string;
            Location: string;
        };
        MalwareProtectionPlan: {
            Role: string;
            ProtectedResource: string;
            Actions: string;
            Tags: string;
        };
        Master: {
            DetectorId: string;
            MasterId: string;
            InvitationId: string;
        };
        Member: {
            Status: string;
            MemberId: string;
            Email: string;
            Message: string;
            DisableEmailNotification: string;
            DetectorId: string;
        };
        PublishingDestination: {
            DestinationProperties: string;
            DetectorId: string;
            DestinationType: string;
            Tags: string;
        };
        ThreatEntitySet: {
            Format: string;
            Activate: string;
            DetectorId: string;
            ExpectedBucketOwner: string;
            Tags: string;
            Name: string;
            Location: string;
        };
        ThreatIntelSet: {
            Format: string;
            Activate: string;
            DetectorId: string;
            ExpectedBucketOwner: string;
            Tags: string;
            Name: string;
            Location: string;
        };
        TrustedEntitySet: {
            Format: string;
            Activate: string;
            DetectorId: string;
            ExpectedBucketOwner: string;
            Tags: string;
            Name: string;
            Location: string;
        };
    };
    HealthImaging: {
        Datastore: {
            KmsKeyArn: string;
            DatastoreName: string;
            Tags: string;
        };
    };
    HealthLake: {
        FHIRDatastore: {
            DatastoreTypeVersion: string;
            DatastoreName: string;
            IdentityProviderConfiguration: string;
            Tags: string;
            PreloadDataConfig: string;
            SseConfiguration: string;
        };
    };
    IAM: {
        AccessKey: {
            Serial: string;
            Status: string;
            UserName: string;
        };
        Group: {
            GroupName: string;
            Path: string;
            ManagedPolicyArns: string;
            Policies: string;
        };
        GroupPolicy: {
            GroupName: string;
            PolicyName: string;
            PolicyDocument: string;
        };
        InstanceProfile: {
            Path: string;
            InstanceProfileName: string;
            Roles: string;
        };
        ManagedPolicy: {
            ManagedPolicyName: string;
            Path: string;
            Description: string;
            Groups: string;
            PolicyDocument: string;
            Roles: string;
            Users: string;
        };
        OIDCProvider: {
            ClientIdList: string;
            ThumbprintList: string;
            Url: string;
            Tags: string;
        };
        Policy: {
            Groups: string;
            PolicyName: string;
            PolicyDocument: string;
            Roles: string;
            Users: string;
        };
        Role: {
            Path: string;
            ManagedPolicyArns: string;
            MaxSessionDuration: string;
            RoleName: string;
            Description: string;
            Policies: string;
            AssumeRolePolicyDocument: string;
            Tags: string;
            PermissionsBoundary: string;
        };
        RolePolicy: {
            RoleName: string;
            PolicyName: string;
            PolicyDocument: string;
        };
        SAMLProvider: {
            AddPrivateKey: string;
            RemovePrivateKey: string;
            AssertionEncryptionMode: string;
            SamlMetadataDocument: string;
            PrivateKeyList: string;
            Tags: string;
            Name: string;
        };
        ServerCertificate: {
            CertificateBody: string;
            Path: string;
            PrivateKey: string;
            CertificateChain: string;
            ServerCertificateName: string;
            Tags: string;
        };
        ServiceLinkedRole: {
            CustomSuffix: string;
            Description: string;
            AWSServiceName: string;
        };
        User: {
            Path: string;
            ManagedPolicyArns: string;
            Policies: string;
            UserName: string;
            Groups: string;
            LoginProfile: string;
            Tags: string;
            PermissionsBoundary: string;
        };
        UserPolicy: {
            UserName: string;
            PolicyName: string;
            PolicyDocument: string;
        };
        UserToGroupAddition: {
            GroupName: string;
            Users: string;
        };
        VirtualMFADevice: {
            Path: string;
            VirtualMfaDeviceName: string;
            Users: string;
            Tags: string;
        };
    };
    IVS: {
        Channel: {
            Type: string;
            RecordingConfigurationArn: string;
            Authorized: string;
            MultitrackInputConfiguration: string;
            Preset: string;
            ContainerFormat: string;
            InsecureIngest: string;
            LatencyMode: string;
            Tags: string;
            Name: string;
        };
        EncoderConfiguration: {
            Video: string;
            Tags: string;
            Name: string;
        };
        IngestConfiguration: {
            UserId: string;
            IngestProtocol: string;
            StageArn: string;
            InsecureIngest: string;
            Tags: string;
            Name: string;
        };
        PlaybackKeyPair: {
            PublicKeyMaterial: string;
            Tags: string;
            Name: string;
        };
        PlaybackRestrictionPolicy: {
            AllowedOrigins: string;
            EnableStrictOriginEnforcement: string;
            AllowedCountries: string;
            Tags: string;
            Name: string;
        };
        PublicKey: {
            PublicKeyMaterial: string;
            Tags: string;
            Name: string;
        };
        RecordingConfiguration: {
            DestinationConfiguration: string;
            RenditionConfiguration: string;
            RecordingReconnectWindowSeconds: string;
            Tags: string;
            ThumbnailConfiguration: string;
            Name: string;
        };
        Stage: {
            AutoParticipantRecordingConfiguration: string;
            Tags: string;
            Name: string;
        };
        StorageConfiguration: {
            S3: string;
            Tags: string;
            Name: string;
        };
        StreamKey: {
            ChannelArn: string;
            Tags: string;
        };
    };
    IVSChat: {
        LoggingConfiguration: {
            DestinationConfiguration: string;
            Tags: string;
            Name: string;
        };
        Room: {
            MaximumMessageRatePerSecond: string;
            MaximumMessageLength: string;
            MessageReviewHandler: string;
            LoggingConfigurationIdentifiers: string;
            Tags: string;
            Name: string;
        };
    };
    IdentityStore: {
        Group: {
            Description: string;
            DisplayName: string;
            IdentityStoreId: string;
        };
        GroupMembership: {
            MemberId: string;
            IdentityStoreId: string;
            GroupId: string;
        };
    };
    ImageBuilder: {
        Component: {
            Description: string;
            SupportedOsVersions: string;
            Platform: string;
            KmsKeyId: string;
            Version: string;
            ChangeDescription: string;
            Data: string;
            Uri: string;
            Tags: string;
            Name: string;
        };
        ContainerRecipe: {
            WorkingDirectory: string;
            ParentImage: string;
            Description: string;
            KmsKeyId: string;
            InstanceConfiguration: string;
            ContainerType: string;
            Name: string;
            DockerfileTemplateData: string;
            Components: string;
            TargetRepository: string;
            Version: string;
            PlatformOverride: string;
            ImageOsVersionOverride: string;
            Tags: string;
            DockerfileTemplateUri: string;
        };
        DistributionConfiguration: {
            Description: string;
            Tags: string;
            Name: string;
            Distributions: string;
        };
        Image: {
            ImageScanningConfiguration: string;
            InfrastructureConfigurationArn: string;
            ImageRecipeArn: string;
            DistributionConfigurationArn: string;
            ContainerRecipeArn: string;
            Workflows: string;
            ImageTestsConfiguration: string;
            EnhancedImageMetadataEnabled: string;
            ExecutionRole: string;
            Tags: string;
        };
        ImagePipeline: {
            Status: string;
            ImageScanningConfiguration: string;
            Description: string;
            ContainerRecipeArn: string;
            Workflows: string;
            Name: string;
            InfrastructureConfigurationArn: string;
            ImageRecipeArn: string;
            DistributionConfigurationArn: string;
            Schedule: string;
            ImageTestsConfiguration: string;
            EnhancedImageMetadataEnabled: string;
            ExecutionRole: string;
            Tags: string;
        };
        ImageRecipe: {
            Components: string;
            WorkingDirectory: string;
            ParentImage: string;
            Description: string;
            Version: string;
            BlockDeviceMappings: string;
            AdditionalInstanceConfiguration: string;
            Tags: string;
            Name: string;
        };
        InfrastructureConfiguration: {
            Logging: string;
            KeyPair: string;
            Description: string;
            InstanceProfileName: string;
            ResourceTags: string;
            TerminateInstanceOnFailure: string;
            SubnetId: string;
            SecurityGroupIds: string;
            Name: string;
            Placement: string;
            InstanceMetadataOptions: string;
            InstanceTypes: string;
            SnsTopicArn: string;
            Tags: string;
        };
        LifecyclePolicy: {
            Status: string;
            Description: string;
            ResourceType: string;
            PolicyDetails: string;
            ExecutionRole: string;
            ResourceSelection: string;
            Tags: string;
            Name: string;
        };
        Workflow: {
            Type: string;
            Description: string;
            KmsKeyId: string;
            Version: string;
            ChangeDescription: string;
            Data: string;
            Uri: string;
            Tags: string;
            Name: string;
        };
    };
    Inspector: {
        AssessmentTarget: {
            AssessmentTargetName: string;
            ResourceGroupArn: string;
        };
        AssessmentTemplate: {
            AssessmentTargetArn: string;
            DurationInSeconds: string;
            AssessmentTemplateName: string;
            RulesPackageArns: string;
            UserAttributesForFindings: string;
        };
        ResourceGroup: {
            ResourceGroupTags: string;
        };
    };
    InspectorV2: {
        CisScanConfiguration: {
            SecurityLevel: string;
            Schedule: string;
            Targets: string;
            ScanName: string;
            Tags: string;
        };
        CodeSecurityIntegration: {
            Type: string;
            CreateIntegrationDetails: string;
            UpdateIntegrationDetails: string;
            Tags: string;
            Name: string;
        };
        CodeSecurityScanConfiguration: {
            ScopeSettings: string;
            Configuration: string;
            Level: string;
            Tags: string;
            Name: string;
        };
        Filter: {
            Description: string;
            FilterCriteria: string;
            FilterAction: string;
            Tags: string;
            Name: string;
        };
    };
    InternetMonitor: {
        Monitor: {
            Status: string;
            LinkedAccountId: string;
            TrafficPercentageToMonitor: string;
            IncludeLinkedAccounts: string;
            HealthEventsConfig: string;
            ResourcesToAdd: string;
            InternetMeasurementsLogDelivery: string;
            MonitorName: string;
            ResourcesToRemove: string;
            Resources: string;
            MaxCityNetworksToMonitor: string;
            Tags: string;
        };
    };
    Invoicing: {
        InvoiceUnit: {
            Description: string;
            TaxInheritanceDisabled: string;
            ResourceTags: string;
            Rule: string;
            InvoiceReceiver: string;
            Name: string;
        };
    };
    IoT: {
        AccountAuditConfiguration: {
            AccountId: string;
            AuditCheckConfigurations: string;
            AuditNotificationTargetConfigurations: string;
            RoleArn: string;
        };
        Authorizer: {
            Status: string;
            TokenKeyName: string;
            EnableCachingForHttp: string;
            AuthorizerName: string;
            TokenSigningPublicKeys: string;
            SigningDisabled: string;
            Tags: string;
            AuthorizerFunctionArn: string;
        };
        BillingGroup: {
            BillingGroupName: string;
            BillingGroupProperties: string;
            Tags: string;
        };
        CACertificate: {
            Status: string;
            CACertificatePem: string;
            CertificateMode: string;
            AutoRegistrationStatus: string;
            RemoveAutoRegistration: string;
            RegistrationConfig: string;
            VerificationCertificatePem: string;
            Tags: string;
        };
        Certificate: {
            Status: string;
            CACertificatePem: string;
            CertificateMode: string;
            CertificateSigningRequest: string;
            CertificatePem: string;
        };
        CertificateProvider: {
            LambdaFunctionArn: string;
            CertificateProviderName: string;
            AccountDefaultForOperations: string;
            Tags: string;
        };
        Command: {
            Description: string;
            LastUpdatedAt: string;
            Deprecated: string;
            CreatedAt: string;
            DisplayName: string;
            Payload: string;
            CommandId: string;
            PendingDeletion: string;
            MandatoryParameters: string;
            Namespace: string;
            RoleArn: string;
            Tags: string;
        };
        CustomMetric: {
            MetricName: string;
            MetricType: string;
            DisplayName: string;
            Tags: string;
        };
        Dimension: {
            Type: string;
            StringValues: string;
            Tags: string;
            Name: string;
        };
        DomainConfiguration: {
            ApplicationProtocol: string;
            ClientCertificateConfig: string;
            DomainConfigurationName: string;
            DomainName: string;
            DomainConfigurationStatus: string;
            ServerCertificateArns: string;
            ServerCertificateConfig: string;
            AuthorizerConfig: string;
            ServiceType: string;
            ValidationCertificateArn: string;
            TlsConfig: string;
            Tags: string;
            AuthenticationType: string;
        };
        EncryptionConfiguration: {
            EncryptionType: string;
            KmsKeyArn: string;
            KmsAccessRoleArn: string;
        };
        FleetMetric: {
            IndexName: string;
            MetricName: string;
            Description: string;
            QueryString: string;
            Period: string;
            QueryVersion: string;
            Unit: string;
            AggregationType: string;
            AggregationField: string;
            Tags: string;
        };
        JobTemplate: {
            TimeoutConfig: string;
            Description: string;
            JobExecutionsRetryConfig: string;
            AbortConfig: string;
            JobTemplateId: string;
            Document: string;
            DestinationPackageVersions: string;
            JobArn: string;
            JobExecutionsRolloutConfig: string;
            DocumentSource: string;
            MaintenanceWindows: string;
            PresignedUrlConfig: string;
            Tags: string;
        };
        Logging: {
            AccountId: string;
            RoleArn: string;
            DefaultLogLevel: string;
        };
        MitigationAction: {
            ActionName: string;
            ActionParams: string;
            RoleArn: string;
            Tags: string;
        };
        Policy: {
            PolicyName: string;
            PolicyDocument: string;
            Tags: string;
        };
        PolicyPrincipalAttachment: {
            PolicyName: string;
            Principal: string;
        };
        ProvisioningTemplate: {
            ProvisioningRoleArn: string;
            Description: string;
            PreProvisioningHook: string;
            TemplateName: string;
            Enabled: string;
            TemplateBody: string;
            TemplateType: string;
            Tags: string;
        };
        ResourceSpecificLogging: {
            TargetType: string;
            TargetName: string;
            LogLevel: string;
        };
        RoleAlias: {
            RoleAlias: string;
            CredentialDurationSeconds: string;
            RoleArn: string;
            Tags: string;
        };
        ScheduledAudit: {
            DayOfWeek: string;
            TargetCheckNames: string;
            ScheduledAuditName: string;
            DayOfMonth: string;
            Frequency: string;
            Tags: string;
        };
        SecurityProfile: {
            AdditionalMetricsToRetainV2: string;
            MetricsExportConfig: string;
            SecurityProfileDescription: string;
            Behaviors: string;
            SecurityProfileName: string;
            AlertTargets: string;
            TargetArns: string;
            Tags: string;
        };
        SoftwarePackage: {
            Description: string;
            PackageName: string;
            Tags: string;
        };
        SoftwarePackageVersion: {
            Description: string;
            PackageName: string;
            Recipe: string;
            Attributes: string;
            Sbom: string;
            VersionName: string;
            Artifact: string;
            Tags: string;
        };
        Thing: {
            AttributePayload: string;
            ThingName: string;
        };
        ThingGroup: {
            ParentGroupName: string;
            ThingGroupName: string;
            ThingGroupProperties: string;
            QueryString: string;
            Tags: string;
        };
        ThingPrincipalAttachment: {
            Principal: string;
            ThingName: string;
            ThingPrincipalType: string;
        };
        ThingType: {
            DeprecateThingType: string;
            ThingTypeName: string;
            ThingTypeProperties: string;
            Tags: string;
        };
        TopicRule: {
            TopicRulePayload: string;
            RuleName: string;
            Tags: string;
        };
        TopicRuleDestination: {
            Status: string;
            HttpUrlProperties: string;
            VpcProperties: string;
        };
    };
    IoTAnalytics: {
        Channel: {
            ChannelName: string;
            ChannelStorage: string;
            RetentionPeriod: string;
            Tags: string;
        };
        Dataset: {
            Actions: string;
            LateDataRules: string;
            DatasetName: string;
            ContentDeliveryRules: string;
            Triggers: string;
            VersioningConfiguration: string;
            RetentionPeriod: string;
            Tags: string;
        };
        Datastore: {
            DatastoreStorage: string;
            FileFormatConfiguration: string;
            DatastorePartitions: string;
            DatastoreName: string;
            RetentionPeriod: string;
            Tags: string;
        };
        Pipeline: {
            PipelineName: string;
            Tags: string;
            PipelineActivities: string;
        };
    };
    IoTCoreDeviceAdvisor: {
        SuiteDefinition: {
            SuiteDefinitionConfiguration: string;
            Tags: string;
        };
    };
    IoTEvents: {
        AlarmModel: {
            AlarmRule: string;
            AlarmModelName: string;
            AlarmModelDescription: string;
            Severity: string;
            AlarmCapabilities: string;
            RoleArn: string;
            Key: string;
            AlarmEventActions: string;
            Tags: string;
        };
        DetectorModel: {
            DetectorModelDefinition: string;
            EvaluationMethod: string;
            DetectorModelName: string;
            DetectorModelDescription: string;
            Key: string;
            RoleArn: string;
            Tags: string;
        };
        Input: {
            InputDefinition: string;
            InputName: string;
            InputDescription: string;
            Tags: string;
        };
    };
    IoTFleetHub: {
        Application: {
            ApplicationName: string;
            ApplicationDescription: string;
            RoleArn: string;
            Tags: string;
        };
    };
    IoTFleetWise: {
        Campaign: {
            Action: string;
            Compression: string;
            Description: string;
            DataPartitions: string;
            Priority: string;
            SignalsToCollect: string;
            StartTime: string;
            SignalsToFetch: string;
            ExpiryTime: string;
            SpoolingMode: string;
            DataDestinationConfigs: string;
            SignalCatalogArn: string;
            Name: string;
            PostTriggerCollectionDuration: string;
            DataExtraDimensions: string;
            DiagnosticsMode: string;
            TargetArn: string;
            CollectionScheme: string;
            Tags: string;
        };
        DecoderManifest: {
            SignalDecoders: string;
            Status: string;
            Description: string;
            NetworkInterfaces: string;
            ModelManifestArn: string;
            DefaultForUnmappedSignals: string;
            Tags: string;
            Name: string;
        };
        Fleet: {
            Description: string;
            Id: string;
            SignalCatalogArn: string;
            Tags: string;
        };
        ModelManifest: {
            Status: string;
            Description: string;
            SignalCatalogArn: string;
            Nodes: string;
            Tags: string;
            Name: string;
        };
        SignalCatalog: {
            Description: string;
            NodeCounts: string;
            Nodes: string;
            Tags: string;
            Name: string;
        };
        StateTemplate: {
            StateTemplateProperties: string;
            Description: string;
            DataExtraDimensions: string;
            SignalCatalogArn: string;
            MetadataExtraDimensions: string;
            Tags: string;
            Name: string;
        };
        Vehicle: {
            AssociationBehavior: string;
            Attributes: string;
            DecoderManifestArn: string;
            StateTemplates: string;
            ModelManifestArn: string;
            Tags: string;
            Name: string;
        };
    };
    IoTSiteWise: {
        AccessPolicy: {
            AccessPolicyResource: string;
            AccessPolicyIdentity: string;
            AccessPolicyPermission: string;
        };
        Asset: {
            AssetModelId: string;
            AssetDescription: string;
            AssetProperties: string;
            AssetExternalId: string;
            AssetName: string;
            Tags: string;
            AssetHierarchies: string;
        };
        AssetModel: {
            AssetModelDescription: string;
            AssetModelCompositeModels: string;
            EnforcedAssetModelInterfaceRelationships: string;
            AssetModelType: string;
            AssetModelName: string;
            AssetModelHierarchies: string;
            AssetModelProperties: string;
            AssetModelExternalId: string;
            Tags: string;
        };
        ComputationModel: {
            ComputationModelConfiguration: string;
            ComputationModelDescription: string;
            ComputationModelName: string;
            ComputationModelDataBinding: string;
            Tags: string;
        };
        Dashboard: {
            DashboardName: string;
            DashboardDefinition: string;
            ProjectId: string;
            DashboardDescription: string;
            Tags: string;
        };
        Dataset: {
            DatasetName: string;
            DatasetSource: string;
            DatasetDescription: string;
            Tags: string;
        };
        Gateway: {
            GatewayCapabilitySummaries: string;
            GatewayName: string;
            GatewayPlatform: string;
            GatewayVersion: string;
            Tags: string;
        };
        Portal: {
            PortalName: string;
            PortalAuthMode: string;
            NotificationSenderEmail: string;
            Alarms: string;
            PortalTypeConfiguration: string;
            PortalContactEmail: string;
            RoleArn: string;
            PortalType: string;
            Tags: string;
            PortalDescription: string;
        };
        Project: {
            AssetIds: string;
            ProjectName: string;
            PortalId: string;
            ProjectDescription: string;
            Tags: string;
        };
    };
    IoTThingsGraph: {
        FlowTemplate: {
            CompatibleNamespaceVersion: string;
            Definition: string;
        };
    };
    IoTTwinMaker: {
        ComponentType: {
            ExtendsFrom: string;
            Description: string;
            IsSingleton: string;
            PropertyDefinitions: string;
            PropertyGroups: string;
            WorkspaceId: string;
            ComponentTypeId: string;
            Functions: string;
            CompositeComponentTypes: string;
            Tags: string;
        };
        Entity: {
            EntityId: string;
            Components: string;
            ParentEntityId: string;
            CompositeComponents: string;
            Description: string;
            EntityName: string;
            WorkspaceId: string;
            Tags: string;
        };
        Scene: {
            SceneId: string;
            Description: string;
            SceneMetadata: string;
            ContentLocation: string;
            Capabilities: string;
            WorkspaceId: string;
            Tags: string;
        };
        SyncJob: {
            SyncSource: string;
            SyncRole: string;
            WorkspaceId: string;
            Tags: string;
        };
        Workspace: {
            Role: string;
            Description: string;
            WorkspaceId: string;
            S3Location: string;
            Tags: string;
        };
    };
    IoTWireless: {
        Destination: {
            Description: string;
            Expression: string;
            ExpressionType: string;
            Tags: string;
            RoleArn: string;
            Name: string;
        };
        DeviceProfile: {
            LoRaWAN: string;
            Tags: string;
            Name: string;
        };
        FuotaTask: {
            FirmwareUpdateImage: string;
            Description: string;
            LoRaWAN: string;
            FirmwareUpdateRole: string;
            AssociateMulticastGroup: string;
            DisassociateWirelessDevice: string;
            DisassociateMulticastGroup: string;
            AssociateWirelessDevice: string;
            Tags: string;
            Name: string;
        };
        MulticastGroup: {
            Description: string;
            LoRaWAN: string;
            DisassociateWirelessDevice: string;
            AssociateWirelessDevice: string;
            Tags: string;
            Name: string;
        };
        NetworkAnalyzerConfiguration: {
            Description: string;
            TraceContent: string;
            WirelessGateways: string;
            WirelessDevices: string;
            Tags: string;
            Name: string;
        };
        PartnerAccount: {
            PartnerType: string;
            SidewalkResponse: string;
            AccountLinked: string;
            Sidewalk: string;
            PartnerAccountId: string;
            SidewalkUpdate: string;
            Tags: string;
        };
        ServiceProfile: {
            LoRaWAN: string;
            Tags: string;
            Name: string;
        };
        TaskDefinition: {
            AutoCreateTasks: string;
            LoRaWANUpdateGatewayTaskEntry: string;
            Update: string;
            TaskDefinitionType: string;
            Tags: string;
            Name: string;
        };
        WirelessDevice: {
            LastUplinkReceivedAt: string;
            Positioning: string;
            Type: string;
            Description: string;
            LoRaWAN: string;
            DestinationName: string;
            ThingArn: string;
            Tags: string;
            Name: string;
        };
        WirelessDeviceImportTask: {
            DestinationName: string;
            Sidewalk: string;
            Tags: string;
        };
        WirelessGateway: {
            LastUplinkReceivedAt: string;
            Description: string;
            LoRaWAN: string;
            ThingArn: string;
            ThingName: string;
            Tags: string;
            Name: string;
        };
    };
    KMS: {
        Alias: {
            TargetKeyId: string;
            AliasName: string;
        };
        Key: {
            Origin: string;
            MultiRegion: string;
            Description: string;
            PendingWindowInDays: string;
            BypassPolicyLockoutSafetyCheck: string;
            KeyPolicy: string;
            KeySpec: string;
            Enabled: string;
            KeyUsage: string;
            RotationPeriodInDays: string;
            EnableKeyRotation: string;
            Tags: string;
        };
        ReplicaKey: {
            Description: string;
            PendingWindowInDays: string;
            KeyPolicy: string;
            PrimaryKeyArn: string;
            Enabled: string;
            Tags: string;
        };
    };
    KafkaConnect: {
        Connector: {
            KafkaCluster: string;
            KafkaConnectVersion: string;
            ConnectorConfiguration: string;
            LogDelivery: string;
            WorkerConfiguration: string;
            Capacity: string;
            KafkaClusterEncryptionInTransit: string;
            ConnectorDescription: string;
            KafkaClusterClientAuthentication: string;
            ConnectorName: string;
            ServiceExecutionRoleArn: string;
            Tags: string;
            Plugins: string;
        };
        CustomPlugin: {
            Description: string;
            ContentType: string;
            Tags: string;
            Name: string;
            Location: string;
        };
        WorkerConfiguration: {
            PropertiesFileContent: string;
            Description: string;
            Tags: string;
            Name: string;
        };
    };
    Kendra: {
        DataSource: {
            CustomDocumentEnrichmentConfiguration: string;
            IndexId: string;
            LanguageCode: string;
            Type: string;
            Description: string;
            Schedule: string;
            DataSourceConfiguration: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
        Faq: {
            IndexId: string;
            LanguageCode: string;
            Description: string;
            S3Path: string;
            FileFormat: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
        Index: {
            Description: string;
            UserContextPolicy: string;
            CapacityUnits: string;
            ServerSideEncryptionConfiguration: string;
            DocumentMetadataConfigurations: string;
            Tags: string;
            RoleArn: string;
            Edition: string;
            Name: string;
            UserTokenConfigurations: string;
        };
    };
    KendraRanking: {
        ExecutionPlan: {
            Description: string;
            CapacityUnits: string;
            Tags: string;
            Name: string;
        };
    };
    Kinesis: {
        ResourcePolicy: {
            ResourceArn: string;
            ResourcePolicy: string;
        };
        Stream: {
            StreamModeDetails: string;
            StreamEncryption: string;
            RetentionPeriodHours: string;
            DesiredShardLevelMetrics: string;
            Tags: string;
            Name: string;
            ShardCount: string;
        };
        StreamConsumer: {
            ConsumerName: string;
            StreamARN: string;
            Tags: string;
        };
    };
    KinesisAnalytics: {
        Application: {
            ApplicationName: string;
            Inputs: string;
            ApplicationDescription: string;
            ApplicationCode: string;
        };
        ApplicationOutput: {
            ApplicationName: string;
            Output: string;
        };
        ApplicationReferenceDataSource: {
            ApplicationName: string;
            ReferenceDataSource: string;
        };
    };
    KinesisAnalyticsV2: {
        Application: {
            ApplicationName: string;
            RuntimeEnvironment: string;
            RunConfiguration: string;
            ApplicationMode: string;
            ApplicationMaintenanceConfiguration: string;
            ApplicationConfiguration: string;
            ApplicationDescription: string;
            Tags: string;
            ServiceExecutionRole: string;
        };
        ApplicationCloudWatchLoggingOption: {
            ApplicationName: string;
            CloudWatchLoggingOption: string;
        };
        ApplicationOutput: {
            ApplicationName: string;
            Output: string;
        };
        ApplicationReferenceDataSource: {
            ApplicationName: string;
            ReferenceDataSource: string;
        };
    };
    KinesisFirehose: {
        DeliveryStream: {
            DeliveryStreamEncryptionConfigurationInput: string;
            HttpEndpointDestinationConfiguration: string;
            KinesisStreamSourceConfiguration: string;
            DeliveryStreamType: string;
            IcebergDestinationConfiguration: string;
            RedshiftDestinationConfiguration: string;
            AmazonopensearchserviceDestinationConfiguration: string;
            MSKSourceConfiguration: string;
            DirectPutSourceConfiguration: string;
            SplunkDestinationConfiguration: string;
            ExtendedS3DestinationConfiguration: string;
            AmazonOpenSearchServerlessDestinationConfiguration: string;
            ElasticsearchDestinationConfiguration: string;
            SnowflakeDestinationConfiguration: string;
            DatabaseSourceConfiguration: string;
            S3DestinationConfiguration: string;
            DeliveryStreamName: string;
            Tags: string;
        };
    };
    KinesisVideo: {
        SignalingChannel: {
            Type: string;
            MessageTtlSeconds: string;
            Tags: string;
            Name: string;
        };
        Stream: {
            KmsKeyId: string;
            MediaType: string;
            DataRetentionInHours: string;
            Tags: string;
            Name: string;
            DeviceName: string;
        };
    };
    LakeFormation: {
        DataCellsFilter: {
            TableName: string;
            ColumnNames: string;
            RowFilter: string;
            DatabaseName: string;
            TableCatalogId: string;
            Name: string;
            ColumnWildcard: string;
        };
        DataLakeSettings: {
            AllowExternalDataFiltering: string;
            ExternalDataFilteringAllowList: string;
            CreateTableDefaultPermissions: string;
            MutationType: string;
            Parameters: string;
            AllowFullTableExternalDataAccess: string;
            Admins: string;
            CreateDatabaseDefaultPermissions: string;
            AuthorizedSessionTagValueList: string;
            TrustedResourceOwners: string;
        };
        Permissions: {
            DataLakePrincipal: string;
            Resource: string;
            Permissions: string;
            PermissionsWithGrantOption: string;
        };
        PrincipalPermissions: {
            Resource: string;
            Permissions: string;
            Catalog: string;
            Principal: string;
            PermissionsWithGrantOption: string;
        };
        Resource: {
            ResourceArn: string;
            WithFederation: string;
            UseServiceLinkedRole: string;
            HybridAccessEnabled: string;
            RoleArn: string;
        };
        Tag: {
            TagKey: string;
            CatalogId: string;
            TagValues: string;
        };
        TagAssociation: {
            LFTags: string;
            Resource: string;
        };
    };
    Lambda: {
        Alias: {
            FunctionName: string;
            ProvisionedConcurrencyConfig: string;
            Description: string;
            FunctionVersion: string;
            RoutingConfig: string;
            Name: string;
        };
        CodeSigningConfig: {
            Description: string;
            AllowedPublishers: string;
            CodeSigningPolicies: string;
            Tags: string;
        };
        EventInvokeConfig: {
            FunctionName: string;
            MaximumRetryAttempts: string;
            DestinationConfig: string;
            Qualifier: string;
            MaximumEventAgeInSeconds: string;
        };
        EventSourceMapping: {
            StartingPosition: string;
            SelfManagedEventSource: string;
            ParallelizationFactor: string;
            FilterCriteria: string;
            ProvisionedPollerConfig: string;
            MetricsConfig: string;
            FunctionName: string;
            DestinationConfig: string;
            KmsKeyArn: string;
            AmazonManagedKafkaEventSourceConfig: string;
            SourceAccessConfigurations: string;
            Tags: string;
            MaximumBatchingWindowInSeconds: string;
            BatchSize: string;
            MaximumRetryAttempts: string;
            Topics: string;
            ScalingConfig: string;
            Enabled: string;
            EventSourceArn: string;
            SelfManagedKafkaEventSourceConfig: string;
            DocumentDBEventSourceConfig: string;
            TumblingWindowInSeconds: string;
            BisectBatchOnFunctionError: string;
            MaximumRecordAgeInSeconds: string;
            StartingPositionTimestamp: string;
            Queues: string;
            FunctionResponseTypes: string;
        };
        Function: {
            Description: string;
            TracingConfig: string;
            VpcConfig: string;
            RuntimeManagementConfig: string;
            ReservedConcurrentExecutions: string;
            SnapStart: string;
            FileSystemConfigs: string;
            FunctionName: string;
            Runtime: string;
            KmsKeyArn: string;
            PackageType: string;
            CodeSigningConfigArn: string;
            Layers: string;
            Tags: string;
            ImageConfig: string;
            MemorySize: string;
            DeadLetterConfig: string;
            Timeout: string;
            Handler: string;
            Code: string;
            Role: string;
            LoggingConfig: string;
            RecursiveLoop: string;
            Environment: string;
            EphemeralStorage: string;
            Architectures: string;
        };
        LayerVersion: {
            CompatibleRuntimes: string;
            LicenseInfo: string;
            Description: string;
            LayerName: string;
            Content: string;
            CompatibleArchitectures: string;
        };
        LayerVersionPermission: {
            Action: string;
            LayerVersionArn: string;
            OrganizationId: string;
            Principal: string;
        };
        Permission: {
            FunctionName: string;
            Action: string;
            EventSourceToken: string;
            FunctionUrlAuthType: string;
            SourceArn: string;
            SourceAccount: string;
            PrincipalOrgID: string;
            Principal: string;
        };
        Url: {
            Qualifier: string;
            InvokeMode: string;
            AuthType: string;
            TargetFunctionArn: string;
            Cors: string;
        };
        Version: {
            FunctionName: string;
            ProvisionedConcurrencyConfig: string;
            Description: string;
            RuntimePolicy: string;
            CodeSha256: string;
        };
    };
    LaunchWizard: {
        Deployment: {
            Specifications: string;
            WorkloadName: string;
            Tags: string;
            DeploymentPatternName: string;
            Name: string;
        };
    };
    Lex: {
        Bot: {
            Description: string;
            ErrorLogSettings: string;
            RoleArn: string;
            Name: string;
            BotTags: string;
            TestBotAliasTags: string;
            AutoBuildBotLocales: string;
            BotLocales: string;
            IdleSessionTTLInSeconds: string;
            BotFileS3Location: string;
            Replication: string;
            TestBotAliasSettings: string;
            DataPrivacy: string;
        };
        BotAlias: {
            BotVersion: string;
            Description: string;
            BotId: string;
            BotAliasLocaleSettings: string;
            ConversationLogSettings: string;
            SentimentAnalysisSettings: string;
            BotAliasName: string;
            BotAliasTags: string;
        };
        BotVersion: {
            Description: string;
            BotId: string;
            BotVersionLocaleSpecification: string;
        };
        ResourcePolicy: {
            Policy: string;
            ResourceArn: string;
        };
    };
    LicenseManager: {
        Grant: {
            Status: string;
            Principals: string;
            HomeRegion: string;
            AllowedOperations: string;
            LicenseArn: string;
            GrantName: string;
        };
        License: {
            ProductSKU: string;
            Status: string;
            ConsumptionConfiguration: string;
            Validity: string;
            ProductName: string;
            Issuer: string;
            HomeRegion: string;
            Entitlements: string;
            LicenseMetadata: string;
            LicenseName: string;
            Beneficiary: string;
        };
    };
    Lightsail: {
        Alarm: {
            MetricName: string;
            ComparisonOperator: string;
            TreatMissingData: string;
            AlarmName: string;
            ContactProtocols: string;
            MonitoredResourceName: string;
            EvaluationPeriods: string;
            NotificationEnabled: string;
            DatapointsToAlarm: string;
            NotificationTriggers: string;
            Threshold: string;
        };
        Bucket: {
            ObjectVersioning: string;
            ReadOnlyAccessAccounts: string;
            BundleId: string;
            BucketName: string;
            AccessRules: string;
            ResourcesReceivingAccess: string;
            Tags: string;
        };
        Certificate: {
            DomainName: string;
            SubjectAlternativeNames: string;
            CertificateName: string;
            Tags: string;
        };
        Container: {
            PublicDomainNames: string;
            ServiceName: string;
            PrivateRegistryAccess: string;
            ContainerServiceDeployment: string;
            IsDisabled: string;
            Scale: string;
            Power: string;
            Tags: string;
        };
        Database: {
            RelationalDatabaseName: string;
            CaCertificateIdentifier: string;
            AvailabilityZone: string;
            PreferredMaintenanceWindow: string;
            RelationalDatabaseBlueprintId: string;
            PreferredBackupWindow: string;
            MasterDatabaseName: string;
            MasterUserPassword: string;
            RelationalDatabaseParameters: string;
            RotateMasterUserPassword: string;
            MasterUsername: string;
            PubliclyAccessible: string;
            RelationalDatabaseBundleId: string;
            BackupRetention: string;
            Tags: string;
        };
        Disk: {
            SizeInGb: string;
            AvailabilityZone: string;
            AddOns: string;
            DiskName: string;
            Tags: string;
            Location: string;
        };
        Distribution: {
            IpAddressType: string;
            Origin: string;
            DistributionName: string;
            BundleId: string;
            DefaultCacheBehavior: string;
            IsEnabled: string;
            CacheBehaviorSettings: string;
            CertificateName: string;
            Tags: string;
            CacheBehaviors: string;
        };
        Domain: {
            DomainName: string;
            DomainEntries: string;
            Tags: string;
        };
        Instance: {
            InstanceName: string;
            KeyPairName: string;
            BundleId: string;
            BlueprintId: string;
            Networking: string;
            UserData: string;
            State: string;
            AvailabilityZone: string;
            AddOns: string;
            Hardware: string;
            Tags: string;
            Location: string;
        };
        InstanceSnapshot: {
            InstanceName: string;
            InstanceSnapshotName: string;
            Tags: string;
        };
        LoadBalancer: {
            IpAddressType: string;
            SessionStickinessLBCookieDurationSeconds: string;
            LoadBalancerName: string;
            AttachedInstances: string;
            InstancePort: string;
            HealthCheckPath: string;
            SessionStickinessEnabled: string;
            TlsPolicyName: string;
            Tags: string;
        };
        LoadBalancerTlsCertificate: {
            LoadBalancerName: string;
            CertificateDomainName: string;
            IsAttached: string;
            CertificateAlternativeNames: string;
            HttpsRedirectionEnabled: string;
            CertificateName: string;
        };
        StaticIp: {
            StaticIpName: string;
            AttachedTo: string;
        };
    };
    Location: {
        APIKey: {
            KeyName: string;
            Description: string;
            NoExpiry: string;
            ForceDelete: string;
            ExpireTime: string;
            ForceUpdate: string;
            Restrictions: string;
            Tags: string;
        };
        GeofenceCollection: {
            Description: string;
            KmsKeyId: string;
            CollectionName: string;
            Tags: string;
        };
        Map: {
            MapName: string;
            Description: string;
            Configuration: string;
            PricingPlan: string;
            Tags: string;
        };
        PlaceIndex: {
            IndexName: string;
            Description: string;
            PricingPlan: string;
            DataSourceConfiguration: string;
            Tags: string;
            DataSource: string;
        };
        RouteCalculator: {
            CalculatorName: string;
            Description: string;
            PricingPlan: string;
            Tags: string;
            DataSource: string;
        };
        Tracker: {
            TrackerName: string;
            Description: string;
            EventBridgeEnabled: string;
            KmsKeyId: string;
            KmsKeyEnableGeospatialQueries: string;
            PositionFiltering: string;
            Tags: string;
        };
        TrackerConsumer: {
            TrackerName: string;
            ConsumerArn: string;
        };
    };
    Logs: {
        AccountPolicy: {
            PolicyType: string;
            Scope: string;
            PolicyName: string;
            SelectionCriteria: string;
            PolicyDocument: string;
        };
        Delivery: {
            S3EnableHiveCompatiblePath: string;
            FieldDelimiter: string;
            DeliveryDestinationArn: string;
            DeliverySourceName: string;
            RecordFields: string;
            S3SuffixPath: string;
            Tags: string;
        };
        DeliveryDestination: {
            DestinationResourceArn: string;
            OutputFormat: string;
            DeliveryDestinationPolicy: string;
            Tags: string;
            Name: string;
        };
        DeliverySource: {
            ResourceArn: string;
            LogType: string;
            Tags: string;
            Name: string;
        };
        Destination: {
            DestinationPolicy: string;
            DestinationName: string;
            TargetArn: string;
            Tags: string;
            RoleArn: string;
        };
        Integration: {
            IntegrationName: string;
            ResourceConfig: string;
            IntegrationType: string;
        };
        LogAnomalyDetector: {
            AnomalyVisibilityTime: string;
            FilterPattern: string;
            AccountId: string;
            KmsKeyId: string;
            LogGroupArnList: string;
            EvaluationFrequency: string;
            DetectorName: string;
        };
        LogGroup: {
            FieldIndexPolicies: string;
            RetentionInDays: string;
            KmsKeyId: string;
            LogGroupClass: string;
            ResourcePolicyDocument: string;
            LogGroupName: string;
            Tags: string;
            DataProtectionPolicy: string;
        };
        LogStream: {
            LogStreamName: string;
            LogGroupName: string;
        };
        MetricFilter: {
            MetricTransformations: string;
            FilterPattern: string;
            LogGroupName: string;
            ApplyOnTransformedLogs: string;
            FilterName: string;
        };
        QueryDefinition: {
            QueryString: string;
            LogGroupNames: string;
            QueryLanguage: string;
            Name: string;
        };
        ResourcePolicy: {
            PolicyName: string;
            PolicyDocument: string;
        };
        SubscriptionFilter: {
            FilterPattern: string;
            Distribution: string;
            LogGroupName: string;
            ApplyOnTransformedLogs: string;
            FilterName: string;
            DestinationArn: string;
            RoleArn: string;
        };
        Transformer: {
            TransformerConfig: string;
            LogGroupIdentifier: string;
        };
    };
    LookoutEquipment: {
        InferenceScheduler: {
            InferenceSchedulerName: string;
            DataUploadFrequency: string;
            ModelName: string;
            DataInputConfiguration: string;
            DataOutputConfiguration: string;
            ServerSideKmsKeyId: string;
            DataDelayOffsetInMinutes: string;
            RoleArn: string;
            Tags: string;
        };
    };
    LookoutMetrics: {
        Alert: {
            AlertDescription: string;
            Action: string;
            AlertName: string;
            AlertSensitivityThreshold: string;
            AnomalyDetectorArn: string;
        };
        AnomalyDetector: {
            AnomalyDetectorName: string;
            KmsKeyArn: string;
            AnomalyDetectorDescription: string;
            AnomalyDetectorConfig: string;
            MetricSetList: string;
        };
    };
    LookoutVision: {
        Project: {
            ProjectName: string;
        };
    };
    M2: {
        Application: {
            Description: string;
            KmsKeyId: string;
            Definition: string;
            EngineType: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
        Deployment: {
            EnvironmentId: string;
            ApplicationVersion: string;
            ApplicationId: string;
        };
        Environment: {
            Description: string;
            EngineVersion: string;
            KmsKeyId: string;
            HighAvailabilityConfig: string;
            PreferredMaintenanceWindow: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            Name: string;
            NetworkType: string;
            EngineType: string;
            PubliclyAccessible: string;
            InstanceType: string;
            StorageConfigurations: string;
            Tags: string;
        };
    };
    MPA: {
        ApprovalTeam: {
            ApprovalStrategy: string;
            Policies: string;
            Description: string;
            Approvers: string;
            Tags: string;
            Name: string;
        };
        IdentitySource: {
            IdentitySourceParameters: string;
            Tags: string;
        };
    };
    MSK: {
        BatchScramSecret: {
            ClusterArn: string;
            SecretArnList: string;
        };
        Cluster: {
            KafkaVersion: string;
            NumberOfBrokerNodes: string;
            EncryptionInfo: string;
            OpenMonitoring: string;
            CurrentVersion: string;
            StorageMode: string;
            ConfigurationInfo: string;
            BrokerNodeGroupInfo: string;
            EnhancedMonitoring: string;
            ClusterName: string;
            ClientAuthentication: string;
            LoggingInfo: string;
            Tags: string;
        };
        ClusterPolicy: {
            Policy: string;
            ClusterArn: string;
        };
        Configuration: {
            Description: string;
            LatestRevision: string;
            ServerProperties: string;
            KafkaVersionsList: string;
            Name: string;
        };
        Replicator: {
            Description: string;
            ServiceExecutionRoleArn: string;
            ReplicatorName: string;
            ReplicationInfoList: string;
            KafkaClusters: string;
            Tags: string;
        };
        ServerlessCluster: {
            VpcConfigs: string;
            ClusterName: string;
            ClientAuthentication: string;
            Tags: string;
        };
        VpcConnection: {
            SecurityGroups: string;
            TargetClusterArn: string;
            ClientSubnets: string;
            VpcId: string;
            Authentication: string;
            Tags: string;
        };
    };
    MWAA: {
        Environment: {
            AirflowConfigurationOptions: string;
            PluginsS3Path: string;
            WorkerReplacementStrategy: string;
            StartupScriptS3Path: string;
            Name: string;
            ExecutionRoleArn: string;
            StartupScriptS3ObjectVersion: string;
            DagS3Path: string;
            LoggingConfiguration: string;
            WebserverAccessMode: string;
            NetworkConfiguration: string;
            KmsKey: string;
            Tags: string;
            MaxWorkers: string;
            EnvironmentClass: string;
            Schedulers: string;
            RequirementsS3Path: string;
            MinWorkers: string;
            AirflowVersion: string;
            RequirementsS3ObjectVersion: string;
            SourceBucketArn: string;
            WeeklyMaintenanceWindowStart: string;
            PluginsS3ObjectVersion: string;
            EndpointManagement: string;
            MaxWebservers: string;
            MinWebservers: string;
        };
    };
    Macie: {
        AllowList: {
            Description: string;
            Criteria: string;
            Tags: string;
            Name: string;
        };
        CustomDataIdentifier: {
            Description: string;
            Keywords: string;
            Regex: string;
            IgnoreWords: string;
            Tags: string;
            Name: string;
            MaximumMatchDistance: string;
        };
        FindingsFilter: {
            Action: string;
            Description: string;
            Position: string;
            FindingCriteria: string;
            Tags: string;
            Name: string;
        };
        Session: {
            Status: string;
            FindingPublishingFrequency: string;
        };
    };
    ManagedBlockchain: {
        Accessor: {
            NetworkType: string;
            Tags: string;
            AccessorType: string;
        };
        Member: {
            MemberConfiguration: string;
            NetworkConfiguration: string;
            NetworkId: string;
            InvitationId: string;
        };
        Node: {
            MemberId: string;
            NetworkId: string;
            NodeConfiguration: string;
        };
    };
    MediaConnect: {
        Bridge: {
            SourceFailoverConfig: string;
            IngressGatewayBridge: string;
            EgressGatewayBridge: string;
            Outputs: string;
            PlacementArn: string;
            Sources: string;
            Name: string;
        };
        BridgeOutput: {
            BridgeArn: string;
            NetworkOutput: string;
            Name: string;
        };
        BridgeSource: {
            NetworkSource: string;
            BridgeArn: string;
            FlowSource: string;
            Name: string;
        };
        Flow: {
            SourceMonitoringConfig: string;
            SourceFailoverConfig: string;
            VpcInterfaces: string;
            MediaStreams: string;
            NdiConfig: string;
            AvailabilityZone: string;
            Maintenance: string;
            Source: string;
            FlowSize: string;
            Name: string;
        };
        FlowEntitlement: {
            DataTransferSubscriberFeePercent: string;
            Description: string;
            Encryption: string;
            Subscribers: string;
            FlowArn: string;
            EntitlementStatus: string;
            Name: string;
        };
        FlowOutput: {
            Destination: string;
            SmoothingLatency: string;
            StreamId: string;
            Description: string;
            NdiSpeedHqQuality: string;
            Port: string;
            RemoteId: string;
            MediaStreamOutputConfigurations: string;
            Encryption: string;
            OutputStatus: string;
            Name: string;
            VpcInterfaceAttachment: string;
            MinLatency: string;
            Protocol: string;
            FlowArn: string;
            NdiProgramName: string;
            MaxLatency: string;
            CidrAllowList: string;
        };
        FlowSource: {
            StreamId: string;
            Description: string;
            SenderIpAddress: string;
            IngestPort: string;
            SenderControlPort: string;
            Decryption: string;
            GatewayBridgeSource: string;
            SourceListenerAddress: string;
            SourceListenerPort: string;
            Name: string;
            WhitelistCidr: string;
            EntitlementArn: string;
            MinLatency: string;
            VpcInterfaceName: string;
            MaxBitrate: string;
            Protocol: string;
            FlowArn: string;
            MaxLatency: string;
        };
        FlowVpcInterface: {
            SubnetId: string;
            FlowArn: string;
            SecurityGroupIds: string;
            RoleArn: string;
            Name: string;
        };
        Gateway: {
            Networks: string;
            EgressCidrBlocks: string;
            Name: string;
        };
    };
    MediaConvert: {
        JobTemplate: {
            Category: string;
            Description: string;
            AccelerationSettings: string;
            Priority: string;
            StatusUpdateInterval: string;
            SettingsJson: string;
            Queue: string;
            HopDestinations: string;
            Tags: string;
            Name: string;
        };
        Preset: {
            Category: string;
            Description: string;
            SettingsJson: string;
            Tags: string;
            Name: string;
        };
        Queue: {
            Status: string;
            Description: string;
            PricingPlan: string;
            Tags: string;
            ConcurrentJobs: string;
            Name: string;
        };
    };
    MediaLive: {
        Channel: {
            InputAttachments: string;
            InputSpecification: string;
            Destinations: string;
            DryRun: string;
            Vpc: string;
            ChannelEngineVersion: string;
            Maintenance: string;
            LogLevel: string;
            RoleArn: string;
            Name: string;
            ChannelClass: string;
            EncoderSettings: string;
            AnywhereSettings: string;
            CdiInputSpecification: string;
            Tags: string;
        };
        ChannelPlacementGroup: {
            ClusterId: string;
            Nodes: string;
            Tags: string;
            Name: string;
        };
        CloudWatchAlarmTemplate: {
            TargetResourceType: string;
            ComparisonOperator: string;
            TreatMissingData: string;
            Description: string;
            Period: string;
            EvaluationPeriods: string;
            GroupIdentifier: string;
            Name: string;
            MetricName: string;
            Statistic: string;
            DatapointsToAlarm: string;
            Tags: string;
            Threshold: string;
        };
        CloudWatchAlarmTemplateGroup: {
            Description: string;
            Tags: string;
            Name: string;
        };
        Cluster: {
            NetworkSettings: string;
            InstanceRoleArn: string;
            ClusterType: string;
            Tags: string;
            Name: string;
        };
        EventBridgeRuleTemplate: {
            Description: string;
            EventTargets: string;
            EventType: string;
            Tags: string;
            GroupIdentifier: string;
            Name: string;
        };
        EventBridgeRuleTemplateGroup: {
            Description: string;
            Tags: string;
            Name: string;
        };
        Input: {
            SrtSettings: string;
            InputNetworkLocation: string;
            Destinations: string;
            Vpc: string;
            MediaConnectFlows: string;
            Sources: string;
            RoleArn: string;
            Name: string;
            Type: string;
            Smpte2110ReceiverGroupSettings: string;
            SdiSources: string;
            InputSecurityGroups: string;
            MulticastSettings: string;
            InputDevices: string;
            Tags: string;
        };
        InputSecurityGroup: {
            WhitelistRules: string;
            Tags: string;
        };
        Multiplex: {
            MultiplexSettings: string;
            AvailabilityZones: string;
            Destinations: string;
            Tags: string;
            Name: string;
        };
        Multiplexprogram: {
            MultiplexId: string;
            PreferredChannelPipeline: string;
            PacketIdentifiersMap: string;
            PipelineDetails: string;
            MultiplexProgramSettings: string;
            ProgramName: string;
        };
        Network: {
            IpPools: string;
            Routes: string;
            Tags: string;
            Name: string;
        };
        SdiSource: {
            Type: string;
            Mode: string;
            Tags: string;
            Name: string;
        };
        SignalMap: {
            Description: string;
            EventBridgeRuleTemplateGroupIdentifiers: string;
            DiscoveryEntryPointArn: string;
            CloudWatchAlarmTemplateGroupIdentifiers: string;
            ForceRediscovery: string;
            Tags: string;
            Name: string;
        };
    };
    MediaPackage: {
        Asset: {
            SourceArn: string;
            ResourceId: string;
            Id: string;
            PackagingGroupId: string;
            EgressEndpoints: string;
            Tags: string;
            SourceRoleArn: string;
        };
        Channel: {
            Description: string;
            IngressAccessLogs: string;
            HlsIngest: string;
            Id: string;
            EgressAccessLogs: string;
            Tags: string;
        };
        OriginEndpoint: {
            MssPackage: string;
            Description: string;
            ChannelId: string;
            TimeDelaySeconds: string;
            Origination: string;
            Authorization: string;
            ManifestName: string;
            CmafPackage: string;
            Whitelist: string;
            Id: string;
            HlsPackage: string;
            DashPackage: string;
            Tags: string;
            StartoverWindowSeconds: string;
        };
        PackagingConfiguration: {
            MssPackage: string;
            CmafPackage: string;
            Id: string;
            HlsPackage: string;
            PackagingGroupId: string;
            DashPackage: string;
            Tags: string;
        };
        PackagingGroup: {
            Authorization: string;
            Id: string;
            EgressAccessLogs: string;
            Tags: string;
        };
    };
    MediaPackageV2: {
        Channel: {
            InputSwitchConfiguration: string;
            ChannelName: string;
            Description: string;
            InputType: string;
            OutputHeaderConfiguration: string;
            ChannelGroupName: string;
            Tags: string;
        };
        ChannelGroup: {
            Description: string;
            ChannelGroupName: string;
            Tags: string;
        };
        ChannelPolicy: {
            Policy: string;
            ChannelName: string;
            ChannelGroupName: string;
        };
        OriginEndpoint: {
            Description: string;
            ChannelName: string;
            LowLatencyHlsManifests: string;
            ContainerType: string;
            ForceEndpointErrorConfiguration: string;
            OriginEndpointName: string;
            HlsManifests: string;
            ChannelGroupName: string;
            DashManifests: string;
            Segment: string;
            Tags: string;
            StartoverWindowSeconds: string;
        };
        OriginEndpointPolicy: {
            Policy: string;
            ChannelName: string;
            OriginEndpointName: string;
            ChannelGroupName: string;
            CdnAuthConfiguration: string;
        };
    };
    MediaStore: {
        Container: {
            Policy: string;
            MetricPolicy: string;
            ContainerName: string;
            CorsPolicy: string;
            LifecyclePolicy: string;
            AccessLoggingEnabled: string;
            Tags: string;
        };
    };
    MediaTailor: {
        Channel: {
            FillerSlate: string;
            ChannelName: string;
            Tier: string;
            Audiences: string;
            Outputs: string;
            LogConfiguration: string;
            PlaybackMode: string;
            Tags: string;
            TimeShiftConfiguration: string;
        };
        ChannelPolicy: {
            Policy: string;
            ChannelName: string;
        };
        LiveSource: {
            LiveSourceName: string;
            SourceLocationName: string;
            HttpPackageConfigurations: string;
            Tags: string;
        };
        PlaybackConfiguration: {
            Bumper: string;
            DashConfiguration: string;
            InsertionMode: string;
            CdnConfiguration: string;
            ManifestProcessingRules: string;
            PersonalizationThresholdSeconds: string;
            LivePreRollConfiguration: string;
            HlsConfiguration: string;
            LogConfiguration: string;
            VideoContentSourceUrl: string;
            Name: string;
            TranscodeProfileName: string;
            ConfigurationAliases: string;
            AdDecisionServerUrl: string;
            AdConditioningConfiguration: string;
            SlateAdUrl: string;
            AvailSuppression: string;
            Tags: string;
        };
        SourceLocation: {
            SourceLocationName: string;
            DefaultSegmentDeliveryConfiguration: string;
            SegmentDeliveryConfigurations: string;
            HttpConfiguration: string;
            AccessConfiguration: string;
            Tags: string;
        };
        VodSource: {
            VodSourceName: string;
            SourceLocationName: string;
            HttpPackageConfigurations: string;
            Tags: string;
        };
    };
    MemoryDB: {
        ACL: {
            ACLName: string;
            UserNames: string;
            Tags: string;
        };
        Cluster: {
            NumReplicasPerShard: string;
            Description: string;
            FinalSnapshotName: string;
            ParameterGroupName: string;
            SnapshotArns: string;
            Port: string;
            ACLName: string;
            SnapshotName: string;
            NumShards: string;
            TLSEnabled: string;
            NetworkType: string;
            ClusterName: string;
            SnsTopicArn: string;
            Engine: string;
            Tags: string;
            MultiRegionClusterName: string;
            EngineVersion: string;
            KmsKeyId: string;
            SnsTopicStatus: string;
            SubnetGroupName: string;
            AutoMinorVersionUpgrade: string;
            SecurityGroupIds: string;
            ClusterEndpoint: string;
            SnapshotWindow: string;
            SnapshotRetentionLimit: string;
            DataTiering: string;
            NodeType: string;
            IpDiscovery: string;
            MaintenanceWindow: string;
        };
        MultiRegionCluster: {
            MultiRegionParameterGroupName: string;
            Description: string;
            EngineVersion: string;
            MultiRegionClusterNameSuffix: string;
            TLSEnabled: string;
            NodeType: string;
            UpdateStrategy: string;
            Engine: string;
            Tags: string;
            NumShards: string;
        };
        ParameterGroup: {
            Description: string;
            Parameters: string;
            ParameterGroupName: string;
            Family: string;
            Tags: string;
        };
        SubnetGroup: {
            Description: string;
            SubnetGroupName: string;
            SubnetIds: string;
            Tags: string;
        };
        User: {
            AuthenticationMode: string;
            UserName: string;
            AccessString: string;
            Tags: string;
        };
    };
    Neptune: {
        DBCluster: {
            StorageEncrypted: string;
            RestoreToTime: string;
            AssociatedRoles: string;
            SnapshotIdentifier: string;
            DBClusterIdentifier: string;
            PreferredBackupWindow: string;
            DBPort: string;
            VpcSecurityGroupIds: string;
            CopyTagsToSnapshot: string;
            RestoreType: string;
            Tags: string;
            EngineVersion: string;
            KmsKeyId: string;
            AvailabilityZones: string;
            ServerlessScalingConfiguration: string;
            PreferredMaintenanceWindow: string;
            IamAuthEnabled: string;
            DBSubnetGroupName: string;
            DeletionProtection: string;
            UseLatestRestorableTime: string;
            SourceDBClusterIdentifier: string;
            DBClusterParameterGroupName: string;
            BackupRetentionPeriod: string;
            DBInstanceParameterGroupName: string;
            EnableCloudwatchLogsExports: string;
        };
        DBClusterParameterGroup: {
            Description: string;
            Parameters: string;
            Family: string;
            Tags: string;
            Name: string;
        };
        DBInstance: {
            DBParameterGroupName: string;
            DBInstanceClass: string;
            AllowMajorVersionUpgrade: string;
            DBClusterIdentifier: string;
            AvailabilityZone: string;
            PreferredMaintenanceWindow: string;
            AutoMinorVersionUpgrade: string;
            DBSubnetGroupName: string;
            DBInstanceIdentifier: string;
            Tags: string;
        };
        DBParameterGroup: {
            Description: string;
            Parameters: string;
            Family: string;
            Tags: string;
            Name: string;
        };
        DBSubnetGroup: {
            DBSubnetGroupName: string;
            DBSubnetGroupDescription: string;
            SubnetIds: string;
            Tags: string;
        };
        EventSubscription: {
            SourceType: string;
            Enabled: string;
            EventCategories: string;
            SnsTopicArn: string;
            SourceIds: string;
        };
    };
    NeptuneGraph: {
        Graph: {
            PublicConnectivity: string;
            GraphName: string;
            ReplicaCount: string;
            ProvisionedMemory: string;
            DeletionProtection: string;
            VectorSearchConfiguration: string;
            Tags: string;
        };
        PrivateGraphEndpoint: {
            VpcId: string;
            GraphIdentifier: string;
            SecurityGroupIds: string;
            SubnetIds: string;
        };
    };
    NetworkFirewall: {
        Firewall: {
            FirewallPolicyArn: string;
            Description: string;
            SubnetChangeProtection: string;
            TransitGatewayId: string;
            AvailabilityZoneChangeProtection: string;
            FirewallName: string;
            VpcId: string;
            DeleteProtection: string;
            FirewallPolicyChangeProtection: string;
            AvailabilityZoneMappings: string;
            EnabledAnalysisTypes: string;
            Tags: string;
            SubnetMappings: string;
        };
        FirewallPolicy: {
            Description: string;
            FirewallPolicyName: string;
            Tags: string;
            FirewallPolicy: string;
        };
        LoggingConfiguration: {
            EnableMonitoringDashboard: string;
            FirewallName: string;
            FirewallArn: string;
            LoggingConfiguration: string;
        };
        RuleGroup: {
            Type: string;
            Description: string;
            Capacity: string;
            RuleGroupName: string;
            SummaryConfiguration: string;
            RuleGroup: string;
            Tags: string;
        };
        TLSInspectionConfiguration: {
            Description: string;
            TLSInspectionConfigurationName: string;
            Tags: string;
            TLSInspectionConfiguration: string;
        };
        VpcEndpointAssociation: {
            SubnetMapping: string;
            Description: string;
            VpcId: string;
            FirewallArn: string;
            Tags: string;
        };
    };
    NetworkManager: {
        ConnectAttachment: {
            ProposedSegmentChange: string;
            Options: string;
            TransportAttachmentId: string;
            CoreNetworkId: string;
            ProposedNetworkFunctionGroupChange: string;
            NetworkFunctionGroupName: string;
            Tags: string;
            EdgeLocation: string;
        };
        ConnectPeer: {
            ConnectAttachmentId: string;
            PeerAddress: string;
            SubnetArn: string;
            CoreNetworkAddress: string;
            BgpOptions: string;
            InsideCidrBlocks: string;
            Tags: string;
        };
        CoreNetwork: {
            GlobalNetworkId: string;
            Description: string;
            PolicyDocument: string;
            Tags: string;
        };
        CustomerGatewayAssociation: {
            GlobalNetworkId: string;
            DeviceId: string;
            CustomerGatewayArn: string;
            LinkId: string;
        };
        Device: {
            SiteId: string;
            AWSLocation: string;
            Type: string;
            Description: string;
            GlobalNetworkId: string;
            SerialNumber: string;
            Model: string;
            Vendor: string;
            Tags: string;
            Location: string;
        };
        DirectConnectGatewayAttachment: {
            ProposedSegmentChange: string;
            CoreNetworkId: string;
            ProposedNetworkFunctionGroupChange: string;
            EdgeLocations: string;
            DirectConnectGatewayArn: string;
            Tags: string;
        };
        GlobalNetwork: {
            Description: string;
            State: string;
            CreatedAt: string;
            Tags: string;
        };
        Link: {
            SiteId: string;
            Type: string;
            GlobalNetworkId: string;
            Description: string;
            Bandwidth: string;
            Tags: string;
            Provider: string;
        };
        LinkAssociation: {
            GlobalNetworkId: string;
            DeviceId: string;
            LinkId: string;
        };
        Site: {
            Description: string;
            GlobalNetworkId: string;
            Tags: string;
            Location: string;
        };
        SiteToSiteVpnAttachment: {
            ProposedSegmentChange: string;
            CoreNetworkId: string;
            ProposedNetworkFunctionGroupChange: string;
            VpnConnectionArn: string;
            NetworkFunctionGroupName: string;
            Tags: string;
        };
        TransitGatewayPeering: {
            CoreNetworkId: string;
            TransitGatewayArn: string;
            Tags: string;
        };
        TransitGatewayRegistration: {
            GlobalNetworkId: string;
            TransitGatewayArn: string;
        };
        TransitGatewayRouteTableAttachment: {
            ProposedSegmentChange: string;
            TransitGatewayRouteTableArn: string;
            ProposedNetworkFunctionGroupChange: string;
            PeeringId: string;
            NetworkFunctionGroupName: string;
            Tags: string;
        };
        VpcAttachment: {
            ProposedSegmentChange: string;
            SubnetArns: string;
            Options: string;
            CoreNetworkId: string;
            ProposedNetworkFunctionGroupChange: string;
            VpcArn: string;
            Tags: string;
        };
    };
    Notifications: {
        ChannelAssociation: {
            NotificationConfigurationArn: string;
            Arn: string;
        };
        EventRule: {
            EventPattern: string;
            EventType: string;
            NotificationConfigurationArn: string;
            Regions: string;
            Source: string;
        };
        ManagedNotificationAccountContactAssociation: {
            ContactIdentifier: string;
            ManagedNotificationConfigurationArn: string;
        };
        ManagedNotificationAdditionalChannelAssociation: {
            ChannelArn: string;
            ManagedNotificationConfigurationArn: string;
        };
        NotificationConfiguration: {
            Description: string;
            AggregationDuration: string;
            Tags: string;
            Name: string;
        };
        NotificationHub: {
            Region: string;
        };
        OrganizationalUnitAssociation: {
            OrganizationalUnitId: string;
            NotificationConfigurationArn: string;
        };
    };
    NotificationsContacts: {
        EmailContact: {
            EmailAddress: string;
            Tags: string;
            Name: string;
        };
    };
    ODB: {
        CloudAutonomousVmCluster: {
            CloudExadataInfrastructureId: string;
            LicenseModel: string;
            Description: string;
            CpuCoreCountPerNode: string;
            MemoryPerOracleComputeUnitInGBs: string;
            DbServers: string;
            TotalContainerDatabases: string;
            TimeZone: string;
            AutonomousDataStorageSizeInTBs: string;
            ScanListenerPortNonTls: string;
            OdbNetworkId: string;
            IsMtlsEnabledVmCluster: string;
            DisplayName: string;
            ScanListenerPortTls: string;
            MaintenanceWindow: string;
            Tags: string;
        };
        CloudExadataInfrastructure: {
            StorageServerType: string;
            DatabaseServerType: string;
            Shape: string;
            StorageCount: string;
            DisplayName: string;
            AvailabilityZoneId: string;
            CustomerContactsToSendToOCI: string;
            AvailabilityZone: string;
            MaintenanceWindow: string;
            Tags: string;
            ComputeCount: string;
        };
        CloudVmCluster: {
            CloudExadataInfrastructureId: string;
            DataCollectionOptions: string;
            LicenseModel: string;
            MemorySizeInGBs: string;
            CpuCoreCount: string;
            SshPublicKeys: string;
            Hostname: string;
            SystemVersion: string;
            DataStorageSizeInTBs: string;
            IsLocalBackupEnabled: string;
            DbServers: string;
            DbNodes: string;
            TimeZone: string;
            IsSparseDiskgroupEnabled: string;
            GiVersion: string;
            OdbNetworkId: string;
            DbNodeStorageSizeInGBs: string;
            DisplayName: string;
            ClusterName: string;
            Tags: string;
            ScanListenerPortTcp: string;
        };
        OdbNetwork: {
            DefaultDnsPrefix: string;
            CustomDomainName: string;
            ZeroEtlAccess: string;
            DeleteAssociatedResources: string;
            AvailabilityZoneId: string;
            DisplayName: string;
            S3PolicyDocument: string;
            AvailabilityZone: string;
            BackupSubnetCidr: string;
            ClientSubnetCidr: string;
            Tags: string;
            S3Access: string;
        };
        OdbPeeringConnection: {
            OdbNetworkId: string;
            DisplayName: string;
            PeerNetworkId: string;
            Tags: string;
        };
    };
    OSIS: {
        Pipeline: {
            PipelineConfigurationBody: string;
            BufferOptions: string;
            MinUnits: string;
            PipelineName: string;
            VpcOptions: string;
            MaxUnits: string;
            LogPublishingOptions: string;
            EncryptionAtRestOptions: string;
            Tags: string;
        };
    };
    Oam: {
        Link: {
            SinkIdentifier: string;
            LabelTemplate: string;
            ResourceTypes: string;
            LinkConfiguration: string;
            Tags: string;
        };
        Sink: {
            Policy: string;
            Tags: string;
            Name: string;
        };
    };
    ObservabilityAdmin: {
        OrganizationTelemetryRule: {
            Rule: string;
            RuleName: string;
            Tags: string;
        };
        TelemetryRule: {
            Rule: string;
            RuleName: string;
            Tags: string;
        };
    };
    Omics: {
        AnnotationStore: {
            StoreFormat: string;
            Description: string;
            Reference: string;
            SseConfig: string;
            StoreOptions: string;
            Tags: string;
            Name: string;
        };
        ReferenceStore: {
            Description: string;
            SseConfig: string;
            Tags: string;
            Name: string;
        };
        RunGroup: {
            MaxDuration: string;
            MaxGpus: string;
            MaxRuns: string;
            MaxCpus: string;
            Tags: string;
            Name: string;
        };
        SequenceStore: {
            Description: string;
            PropagatedSetLevelTags: string;
            FallbackLocation: string;
            SseConfig: string;
            AccessLogLocation: string;
            ETagAlgorithmFamily: string;
            S3AccessPolicy: string;
            Tags: string;
            Name: string;
        };
        VariantStore: {
            Description: string;
            Reference: string;
            SseConfig: string;
            Tags: string;
            Name: string;
        };
        Workflow: {
            ParameterTemplate: string;
            Description: string;
            StorageType: string;
            StorageCapacity: string;
            DefinitionUri: string;
            Name: string;
            ParameterTemplatePath: string;
            readmeMarkdown: string;
            DefinitionRepository: string;
            Accelerators: string;
            WorkflowBucketOwnerId: string;
            readmePath: string;
            Main: string;
            Engine: string;
            Tags: string;
            readmeUri: string;
        };
        WorkflowVersion: {
            ParameterTemplate: string;
            Description: string;
            StorageType: string;
            StorageCapacity: string;
            WorkflowId: string;
            DefinitionUri: string;
            ParameterTemplatePath: string;
            readmeMarkdown: string;
            DefinitionRepository: string;
            Accelerators: string;
            WorkflowBucketOwnerId: string;
            readmePath: string;
            VersionName: string;
            Main: string;
            Engine: string;
            Tags: string;
            readmeUri: string;
        };
    };
    OpenSearchServerless: {
        AccessPolicy: {
            Policy: string;
            Type: string;
            Description: string;
            Name: string;
        };
        Collection: {
            Type: string;
            Description: string;
            StandbyReplicas: string;
            Tags: string;
            Name: string;
        };
        Index: {
            IndexName: string;
            Mappings: string;
            CollectionEndpoint: string;
            Settings: string;
        };
        LifecyclePolicy: {
            Policy: string;
            Type: string;
            Description: string;
            Name: string;
        };
        SecurityConfig: {
            Type: string;
            Description: string;
            SamlOptions: string;
            IamFederationOptions: string;
            Name: string;
            IamIdentityCenterOptions: string;
        };
        SecurityPolicy: {
            Policy: string;
            Type: string;
            Description: string;
            Name: string;
        };
        VpcEndpoint: {
            VpcId: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            Name: string;
        };
    };
    OpenSearchService: {
        Application: {
            DataSources: string;
            AppConfigs: string;
            Endpoint: string;
            Tags: string;
            IamIdentityCenterOptions: string;
            Name: string;
        };
        Domain: {
            SkipShardMigrationWait: string;
            EngineVersion: string;
            SoftwareUpdateOptions: string;
            DomainName: string;
            LogPublishingOptions: string;
            SnapshotOptions: string;
            VPCOptions: string;
            NodeToNodeEncryptionOptions: string;
            AccessPolicies: string;
            DomainEndpointOptions: string;
            CognitoOptions: string;
            AdvancedOptions: string;
            AdvancedSecurityOptions: string;
            IPAddressType: string;
            IdentityCenterOptions: string;
            EBSOptions: string;
            EncryptionAtRestOptions: string;
            OffPeakWindowOptions: string;
            Tags: string;
            ClusterConfig: string;
        };
    };
    OpsWorks: {
        App: {
            AppSource: string;
            Attributes: string;
            DataSources: string;
            Description: string;
            Domains: string;
            EnableSsl: string;
            Environment: string;
            Name: string;
            Shortname: string;
            SslConfiguration: string;
            StackId: string;
            Type: string;
        };
        ElasticLoadBalancerAttachment: {
            ElasticLoadBalancerName: string;
            LayerId: string;
        };
        Instance: {
            AgentVersion: string;
            AmiId: string;
            Architecture: string;
            AutoScalingType: string;
            AvailabilityZone: string;
            BlockDeviceMappings: string;
            EbsOptimized: string;
            ElasticIps: string;
            Hostname: string;
            InstallUpdatesOnBoot: string;
            InstanceType: string;
            LayerIds: string;
            Os: string;
            RootDeviceType: string;
            SshKeyName: string;
            StackId: string;
            SubnetId: string;
            Tenancy: string;
            TimeBasedAutoScaling: string;
            VirtualizationType: string;
            Volumes: string;
        };
        Layer: {
            Attributes: string;
            AutoAssignElasticIps: string;
            AutoAssignPublicIps: string;
            CustomInstanceProfileArn: string;
            CustomJson: string;
            CustomRecipes: string;
            CustomSecurityGroupIds: string;
            EnableAutoHealing: string;
            InstallUpdatesOnBoot: string;
            LifecycleEventConfiguration: string;
            LoadBasedAutoScaling: string;
            Name: string;
            Packages: string;
            Shortname: string;
            StackId: string;
            Tags: string;
            Type: string;
            UseEbsOptimizedInstances: string;
            VolumeConfigurations: string;
        };
        Stack: {
            AgentVersion: string;
            Attributes: string;
            ChefConfiguration: string;
            CloneAppIds: string;
            ClonePermissions: string;
            ConfigurationManager: string;
            CustomCookbooksSource: string;
            CustomJson: string;
            DefaultAvailabilityZone: string;
            DefaultInstanceProfileArn: string;
            DefaultOs: string;
            DefaultRootDeviceType: string;
            DefaultSshKeyName: string;
            DefaultSubnetId: string;
            EcsClusterArn: string;
            ElasticIps: string;
            HostnameTheme: string;
            Name: string;
            RdsDbInstances: string;
            ServiceRoleArn: string;
            SourceStackId: string;
            Tags: string;
            UseCustomCookbooks: string;
            UseOpsworksSecurityGroups: string;
            VpcId: string;
        };
        UserProfile: {
            AllowSelfManagement: string;
            IamUserArn: string;
            SshPublicKey: string;
            SshUsername: string;
        };
        Volume: {
            Ec2VolumeId: string;
            MountPoint: string;
            Name: string;
            StackId: string;
        };
    };
    OpsWorksCM: {
        Server: {
            KeyPair: string;
            EngineVersion: string;
            ServiceRoleArn: string;
            DisableAutomatedBackup: string;
            BackupId: string;
            EngineModel: string;
            PreferredMaintenanceWindow: string;
            AssociatePublicIpAddress: string;
            InstanceProfileArn: string;
            CustomCertificate: string;
            PreferredBackupWindow: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            CustomDomain: string;
            CustomPrivateKey: string;
            ServerName: string;
            EngineAttributes: string;
            BackupRetentionCount: string;
            InstanceType: string;
            Tags: string;
            Engine: string;
        };
    };
    Organizations: {
        Account: {
            RoleName: string;
            Email: string;
            ParentIds: string;
            Tags: string;
            AccountName: string;
        };
        Organization: {
            FeatureSet: string;
        };
        OrganizationalUnit: {
            ParentId: string;
            Tags: string;
            Name: string;
        };
        Policy: {
            Type: string;
            TargetIds: string;
            Description: string;
            Content: string;
            Tags: string;
            Name: string;
        };
        ResourcePolicy: {
            Content: string;
            Tags: string;
        };
    };
    PCAConnectorAD: {
        Connector: {
            CertificateAuthorityArn: string;
            DirectoryId: string;
            VpcInformation: string;
            Tags: string;
        };
        DirectoryRegistration: {
            DirectoryId: string;
            Tags: string;
        };
        ServicePrincipalName: {
            ConnectorArn: string;
            DirectoryRegistrationArn: string;
        };
        Template: {
            ConnectorArn: string;
            Definition: string;
            Tags: string;
            Name: string;
            ReenrollAllCertificateHolders: string;
        };
        TemplateGroupAccessControlEntry: {
            AccessRights: string;
            TemplateArn: string;
            GroupDisplayName: string;
            GroupSecurityIdentifier: string;
        };
    };
    PCAConnectorSCEP: {
        Challenge: {
            ConnectorArn: string;
            Tags: string;
        };
        Connector: {
            CertificateAuthorityArn: string;
            MobileDeviceManagement: string;
            Tags: string;
        };
    };
    PCS: {
        Cluster: {
            Networking: string;
            Scheduler: string;
            Size: string;
            SlurmConfiguration: string;
            Tags: string;
            Name: string;
        };
        ComputeNodeGroup: {
            ClusterId: string;
            SpotOptions: string;
            SlurmConfiguration: string;
            ScalingConfiguration: string;
            InstanceConfigs: string;
            PurchaseOption: string;
            CustomLaunchTemplate: string;
            SubnetIds: string;
            Tags: string;
            Name: string;
            AmiId: string;
            IamInstanceProfileArn: string;
        };
        Queue: {
            ClusterId: string;
            ComputeNodeGroupConfigurations: string;
            Tags: string;
            Name: string;
        };
    };
    Panorama: {
        ApplicationInstance: {
            DefaultRuntimeContextDevice: string;
            Description: string;
            ApplicationInstanceIdToReplace: string;
            ManifestOverridesPayload: string;
            RuntimeRoleArn: string;
            ManifestPayload: string;
            Tags: string;
            Name: string;
        };
        Package: {
            PackageName: string;
            StorageLocation: string;
            Tags: string;
        };
        PackageVersion: {
            UpdatedLatestPatchVersion: string;
            PatchVersion: string;
            MarkLatest: string;
            PackageId: string;
            OwnerAccount: string;
            PackageVersion: string;
        };
    };
    PaymentCryptography: {
        Alias: {
            AliasName: string;
            KeyArn: string;
        };
        Key: {
            DeriveKeyUsage: string;
            Exportable: string;
            KeyAttributes: string;
            Enabled: string;
            KeyCheckValueAlgorithm: string;
            Tags: string;
        };
    };
    Personalize: {
        Dataset: {
            DatasetGroupArn: string;
            DatasetType: string;
            DatasetImportJob: string;
            SchemaArn: string;
            Name: string;
        };
        DatasetGroup: {
            KmsKeyArn: string;
            Domain: string;
            RoleArn: string;
            Name: string;
        };
        Schema: {
            Schema: string;
            Domain: string;
            Name: string;
        };
        Solution: {
            PerformAutoML: string;
            PerformHPO: string;
            EventType: string;
            DatasetGroupArn: string;
            SolutionConfig: string;
            RecipeArn: string;
            Name: string;
        };
    };
    Pinpoint: {
        ADMChannel: {
            ClientSecret: string;
            Enabled: string;
            ClientId: string;
            ApplicationId: string;
        };
        APNSChannel: {
            BundleId: string;
            PrivateKey: string;
            Enabled: string;
            DefaultAuthenticationMethod: string;
            TokenKey: string;
            ApplicationId: string;
            TeamId: string;
            Certificate: string;
            TokenKeyId: string;
        };
        APNSSandboxChannel: {
            BundleId: string;
            PrivateKey: string;
            Enabled: string;
            DefaultAuthenticationMethod: string;
            TokenKey: string;
            ApplicationId: string;
            TeamId: string;
            Certificate: string;
            TokenKeyId: string;
        };
        APNSVoipChannel: {
            BundleId: string;
            PrivateKey: string;
            Enabled: string;
            DefaultAuthenticationMethod: string;
            TokenKey: string;
            ApplicationId: string;
            TeamId: string;
            Certificate: string;
            TokenKeyId: string;
        };
        APNSVoipSandboxChannel: {
            BundleId: string;
            PrivateKey: string;
            Enabled: string;
            DefaultAuthenticationMethod: string;
            TokenKey: string;
            ApplicationId: string;
            TeamId: string;
            Certificate: string;
            TokenKeyId: string;
        };
        App: {
            Tags: string;
            Name: string;
        };
        ApplicationSettings: {
            QuietTime: string;
            Limits: string;
            ApplicationId: string;
            CampaignHook: string;
            CloudWatchMetricsEnabled: string;
        };
        BaiduChannel: {
            SecretKey: string;
            ApiKey: string;
            Enabled: string;
            ApplicationId: string;
        };
        Campaign: {
            Description: string;
            SegmentId: string;
            Priority: string;
            TemplateConfiguration: string;
            IsPaused: string;
            AdditionalTreatments: string;
            Name: string;
            SegmentVersion: string;
            TreatmentDescription: string;
            MessageConfiguration: string;
            Limits: string;
            HoldoutPercent: string;
            Schedule: string;
            CustomDeliveryConfiguration: string;
            ApplicationId: string;
            CampaignHook: string;
            Tags: string;
            TreatmentName: string;
        };
        EmailChannel: {
            ConfigurationSet: string;
            FromAddress: string;
            OrchestrationSendingRoleArn: string;
            Enabled: string;
            ApplicationId: string;
            Identity: string;
            RoleArn: string;
        };
        EmailTemplate: {
            HtmlPart: string;
            TextPart: string;
            TemplateName: string;
            TemplateDescription: string;
            DefaultSubstitutions: string;
            Subject: string;
            Tags: string;
        };
        EventStream: {
            ApplicationId: string;
            DestinationStreamArn: string;
            RoleArn: string;
        };
        GCMChannel: {
            ApiKey: string;
            Enabled: string;
            ServiceJson: string;
            DefaultAuthenticationMethod: string;
            ApplicationId: string;
        };
        InAppTemplate: {
            CustomConfig: string;
            Layout: string;
            Content: string;
            TemplateName: string;
            TemplateDescription: string;
            Tags: string;
        };
        PushTemplate: {
            GCM: string;
            Baidu: string;
            TemplateName: string;
            ADM: string;
            APNS: string;
            TemplateDescription: string;
            DefaultSubstitutions: string;
            Default: string;
            Tags: string;
        };
        SMSChannel: {
            ShortCode: string;
            Enabled: string;
            ApplicationId: string;
            SenderId: string;
        };
        Segment: {
            SegmentGroups: string;
            Dimensions: string;
            ApplicationId: string;
            Tags: string;
            Name: string;
        };
        SmsTemplate: {
            TemplateName: string;
            TemplateDescription: string;
            DefaultSubstitutions: string;
            Body: string;
            Tags: string;
        };
        VoiceChannel: {
            Enabled: string;
            ApplicationId: string;
        };
    };
    PinpointEmail: {
        ConfigurationSet: {
            SendingOptions: string;
            TrackingOptions: string;
            ReputationOptions: string;
            DeliveryOptions: string;
            Tags: string;
            Name: string;
        };
        ConfigurationSetEventDestination: {
            EventDestinationName: string;
            ConfigurationSetName: string;
            EventDestination: string;
        };
        DedicatedIpPool: {
            PoolName: string;
            Tags: string;
        };
        Identity: {
            FeedbackForwardingEnabled: string;
            DkimSigningEnabled: string;
            Tags: string;
            Name: string;
            MailFromAttributes: string;
        };
    };
    Pipes: {
        Pipe: {
            Enrichment: string;
            KmsKeyIdentifier: string;
            Description: string;
            TargetParameters: string;
            LogConfiguration: string;
            EnrichmentParameters: string;
            RoleArn: string;
            Source: string;
            Name: string;
            Target: string;
            DesiredState: string;
            SourceParameters: string;
            Tags: string;
        };
    };
    Proton: {
        EnvironmentAccountConnection: {
            EnvironmentName: string;
            ComponentRoleArn: string;
            ManagementAccountId: string;
            CodebuildRoleArn: string;
            EnvironmentAccountId: string;
            RoleArn: string;
            Tags: string;
        };
        EnvironmentTemplate: {
            Description: string;
            DisplayName: string;
            EncryptionKey: string;
            Provisioning: string;
            Tags: string;
            Name: string;
        };
        ServiceTemplate: {
            Description: string;
            DisplayName: string;
            PipelineProvisioning: string;
            EncryptionKey: string;
            Tags: string;
            Name: string;
        };
    };
    QBusiness: {
        Application: {
            IdentityType: string;
            Description: string;
            IdentityCenterInstanceArn: string;
            EncryptionConfiguration: string;
            IamIdentityProviderArn: string;
            RoleArn: string;
            AttachmentsConfiguration: string;
            ClientIdsForOIDC: string;
            QuickSightConfiguration: string;
            PersonalizationConfiguration: string;
            DisplayName: string;
            AutoSubscriptionConfiguration: string;
            QAppsConfiguration: string;
            Tags: string;
        };
        DataAccessor: {
            DisplayName: string;
            ActionConfigurations: string;
            ApplicationId: string;
            Principal: string;
            Tags: string;
            AuthenticationDetail: string;
        };
        DataSource: {
            IndexId: string;
            Description: string;
            Configuration: string;
            SyncSchedule: string;
            DocumentEnrichmentConfiguration: string;
            MediaExtractionConfiguration: string;
            DisplayName: string;
            VpcConfiguration: string;
            ApplicationId: string;
            RoleArn: string;
            Tags: string;
        };
        Index: {
            Type: string;
            Description: string;
            DisplayName: string;
            DocumentAttributeConfigurations: string;
            ApplicationId: string;
            Tags: string;
            CapacityConfiguration: string;
        };
        Permission: {
            Actions: string;
            StatementId: string;
            ApplicationId: string;
            Conditions: string;
            Principal: string;
        };
        Plugin: {
            ServerUrl: string;
            CustomPluginConfiguration: string;
            Type: string;
            State: string;
            DisplayName: string;
            AuthConfiguration: string;
            ApplicationId: string;
            Tags: string;
        };
        Retriever: {
            Type: string;
            Configuration: string;
            DisplayName: string;
            ApplicationId: string;
            RoleArn: string;
            Tags: string;
        };
        WebExperience: {
            Origins: string;
            Subtitle: string;
            CustomizationConfiguration: string;
            SamplePromptsControlMode: string;
            Title: string;
            IdentityProviderConfiguration: string;
            WelcomeMessage: string;
            ApplicationId: string;
            RoleArn: string;
            Tags: string;
            BrowserExtensionConfiguration: string;
        };
    };
    QLDB: {
        Ledger: {
            PermissionsMode: string;
            DeletionProtection: string;
            KmsKey: string;
            Tags: string;
            Name: string;
        };
        Stream: {
            InclusiveStartTime: string;
            StreamName: string;
            KinesisConfiguration: string;
            ExclusiveEndTime: string;
            LedgerName: string;
            RoleArn: string;
            Tags: string;
        };
    };
    QuickSight: {
        Analysis: {
            Status: string;
            Parameters: string;
            SourceEntity: string;
            ThemeArn: string;
            Definition: string;
            ValidationStrategy: string;
            FolderArns: string;
            Name: string;
            Errors: string;
            AnalysisId: string;
            AwsAccountId: string;
            Permissions: string;
            Tags: string;
            Sheets: string;
        };
        CustomPermissions: {
            CustomPermissionsName: string;
            Capabilities: string;
            AwsAccountId: string;
            Tags: string;
        };
        Dashboard: {
            Parameters: string;
            VersionDescription: string;
            SourceEntity: string;
            ThemeArn: string;
            Definition: string;
            ValidationStrategy: string;
            FolderArns: string;
            DashboardId: string;
            LinkSharingConfiguration: string;
            Name: string;
            DashboardPublishOptions: string;
            AwsAccountId: string;
            Permissions: string;
            LinkEntities: string;
            Tags: string;
        };
        DataSet: {
            PhysicalTableMap: string;
            FieldFolders: string;
            FolderArns: string;
            DataSetId: string;
            RowLevelPermissionDataSet: string;
            PerformanceConfiguration: string;
            IngestionWaitPolicy: string;
            DataSetRefreshProperties: string;
            RowLevelPermissionTagConfiguration: string;
            ColumnLevelPermissionRules: string;
            Name: string;
            ColumnGroups: string;
            ImportMode: string;
            DatasetParameters: string;
            LogicalTableMap: string;
            Permissions: string;
            AwsAccountId: string;
            DataSetUsageConfiguration: string;
            UseAs: string;
            Tags: string;
        };
        DataSource: {
            ErrorInfo: string;
            FolderArns: string;
            Name: string;
            DataSourceParameters: string;
            Type: string;
            VpcConnectionProperties: string;
            AlternateDataSourceParameters: string;
            AwsAccountId: string;
            Permissions: string;
            SslProperties: string;
            Credentials: string;
            DataSourceId: string;
            Tags: string;
        };
        Folder: {
            SharingModel: string;
            AwsAccountId: string;
            Permissions: string;
            FolderId: string;
            ParentFolderArn: string;
            Tags: string;
            FolderType: string;
            Name: string;
        };
        RefreshSchedule: {
            Schedule: string;
            AwsAccountId: string;
            DataSetId: string;
        };
        Template: {
            VersionDescription: string;
            SourceEntity: string;
            Definition: string;
            AwsAccountId: string;
            Permissions: string;
            ValidationStrategy: string;
            Tags: string;
            TemplateId: string;
            Name: string;
        };
        Theme: {
            ThemeId: string;
            VersionDescription: string;
            Configuration: string;
            BaseThemeId: string;
            AwsAccountId: string;
            Permissions: string;
            Tags: string;
            Name: string;
        };
        Topic: {
            CustomInstructions: string;
            Description: string;
            DataSets: string;
            AwsAccountId: string;
            FolderArns: string;
            TopicId: string;
            UserExperienceVersion: string;
            ConfigOptions: string;
            Tags: string;
            Name: string;
        };
        VPCConnection: {
            DnsResolvers: string;
            AvailabilityStatus: string;
            AwsAccountId: string;
            VPCConnectionId: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            RoleArn: string;
            Tags: string;
            Name: string;
        };
    };
    RAM: {
        Permission: {
            ResourceType: string;
            PolicyTemplate: string;
            Tags: string;
            Name: string;
        };
        ResourceShare: {
            PermissionArns: string;
            Principals: string;
            AllowExternalPrincipals: string;
            ResourceArns: string;
            Sources: string;
            Tags: string;
            Name: string;
        };
    };
    RDS: {
        CustomDBEngineVersion: {
            Status: string;
            DatabaseInstallationFilesS3BucketName: string;
            Description: string;
            EngineVersion: string;
            KMSKeyId: string;
            UseAwsProvidedLatestImage: string;
            ImageId: string;
            DatabaseInstallationFilesS3Prefix: string;
            Manifest: string;
            SourceCustomDbEngineVersionIdentifier: string;
            Engine: string;
            Tags: string;
        };
        DBCluster: {
            DatabaseInsightsMode: string;
            StorageEncrypted: string;
            DBSystemId: string;
            RestoreToTime: string;
            EngineMode: string;
            Port: string;
            DBClusterIdentifier: string;
            MonitoringInterval: string;
            ReplicationSourceIdentifier: string;
            Engine: string;
            Tags: string;
            EngineVersion: string;
            StorageType: string;
            KmsKeyId: string;
            ServerlessV2ScalingConfiguration: string;
            DeleteAutomatedBackups: string;
            PerformanceInsightsRetentionPeriod: string;
            DatabaseName: string;
            EnableLocalWriteForwarding: string;
            AutoMinorVersionUpgrade: string;
            DBSubnetGroupName: string;
            DeletionProtection: string;
            AllocatedStorage: string;
            SourceDbClusterResourceId: string;
            MasterUserPassword: string;
            MasterUserSecret: string;
            SourceDBClusterIdentifier: string;
            MasterUsername: string;
            ScalingConfiguration: string;
            PerformanceInsightsKmsKeyId: string;
            PubliclyAccessible: string;
            Domain: string;
            BacktrackWindow: string;
            DBInstanceParameterGroupName: string;
            EnableGlobalWriteForwarding: string;
            MonitoringRoleArn: string;
            AssociatedRoles: string;
            EnableHttpEndpoint: string;
            SnapshotIdentifier: string;
            ClusterScalabilityType: string;
            PreferredBackupWindow: string;
            NetworkType: string;
            VpcSecurityGroupIds: string;
            CopyTagsToSnapshot: string;
            GlobalClusterIdentifier: string;
            RestoreType: string;
            DomainIAMRoleName: string;
            EngineLifecycleSupport: string;
            DBClusterInstanceClass: string;
            AvailabilityZones: string;
            PreferredMaintenanceWindow: string;
            Iops: string;
            SourceRegion: string;
            UseLatestRestorableTime: string;
            ManageMasterUserPassword: string;
            EnableIAMDatabaseAuthentication: string;
            DBClusterParameterGroupName: string;
            PerformanceInsightsEnabled: string;
            BackupRetentionPeriod: string;
            EnableCloudwatchLogsExports: string;
        };
        DBClusterParameterGroup: {
            Description: string;
            Parameters: string;
            Family: string;
            DBClusterParameterGroupName: string;
            Tags: string;
        };
        DBInstance: {
            Timezone: string;
            DatabaseInsightsMode: string;
            StorageEncrypted: string;
            DBSystemId: string;
            Port: string;
            DBClusterIdentifier: string;
            StorageThroughput: string;
            AutomaticBackupReplicationRetentionPeriod: string;
            MonitoringInterval: string;
            DBParameterGroupName: string;
            MultiAZ: string;
            AutomaticBackupReplicationKmsKeyId: string;
            Tags: string;
            Engine: string;
            PerformanceInsightsKMSKeyId: string;
            SourceDBInstanceIdentifier: string;
            EngineVersion: string;
            StorageType: string;
            KmsKeyId: string;
            DBInstanceClass: string;
            DeleteAutomatedBackups: string;
            PerformanceInsightsRetentionPeriod: string;
            AvailabilityZone: string;
            OptionGroupName: string;
            EnablePerformanceInsights: string;
            DBSubnetGroupName: string;
            AutoMinorVersionUpgrade: string;
            DeletionProtection: string;
            DBInstanceIdentifier: string;
            AllocatedStorage: string;
            MasterUserPassword: string;
            MasterUserSecret: string;
            NcharCharacterSetName: string;
            SourceDBClusterIdentifier: string;
            DBSecurityGroups: string;
            MasterUsername: string;
            MaxAllocatedStorage: string;
            PromotionTier: string;
            PubliclyAccessible: string;
            Domain: string;
            ApplyImmediately: string;
            DomainFqdn: string;
            CharacterSetName: string;
            MonitoringRoleArn: string;
            AssociatedRoles: string;
            DomainOu: string;
            DBClusterSnapshotIdentifier: string;
            SourceDBInstanceAutomatedBackupsArn: string;
            ProcessorFeatures: string;
            PreferredBackupWindow: string;
            RestoreTime: string;
            CertificateRotationRestart: string;
            NetworkType: string;
            DedicatedLogVolume: string;
            CopyTagsToSnapshot: string;
            DomainIAMRoleName: string;
            ReplicaMode: string;
            EngineLifecycleSupport: string;
            LicenseModel: string;
            DomainDnsIps: string;
            PreferredMaintenanceWindow: string;
            Iops: string;
            SourceRegion: string;
            BackupTarget: string;
            UseLatestRestorableTime: string;
            CACertificateIdentifier: string;
            ManageMasterUserPassword: string;
            SourceDbiResourceId: string;
            DomainAuthSecretArn: string;
            VPCSecurityGroups: string;
            AutomaticBackupReplicationRegion: string;
            AllowMajorVersionUpgrade: string;
            DBName: string;
            EnableIAMDatabaseAuthentication: string;
            BackupRetentionPeriod: string;
            CustomIAMInstanceProfile: string;
            DBSnapshotIdentifier: string;
            EnableCloudwatchLogsExports: string;
            UseDefaultProcessorFeatures: string;
        };
        DBParameterGroup: {
            DBParameterGroupName: string;
            Description: string;
            Parameters: string;
            Family: string;
            Tags: string;
        };
        DBProxy: {
            RequireTLS: string;
            DBProxyName: string;
            IdleClientTimeout: string;
            VpcSecurityGroupIds: string;
            Auth: string;
            DebugLogging: string;
            VpcSubnetIds: string;
            RoleArn: string;
            EngineFamily: string;
            Tags: string;
        };
        DBProxyEndpoint: {
            DBProxyEndpointName: string;
            DBProxyName: string;
            TargetRole: string;
            VpcSecurityGroupIds: string;
            VpcSubnetIds: string;
            Tags: string;
        };
        DBProxyTargetGroup: {
            DBProxyName: string;
            DBInstanceIdentifiers: string;
            TargetGroupName: string;
            ConnectionPoolConfigurationInfo: string;
            DBClusterIdentifiers: string;
        };
        DBSecurityGroup: {
            DBSecurityGroupIngress: string;
            EC2VpcId: string;
            GroupDescription: string;
            Tags: string;
        };
        DBSecurityGroupIngress: {
            CIDRIP: string;
            DBSecurityGroupName: string;
            EC2SecurityGroupId: string;
            EC2SecurityGroupName: string;
            EC2SecurityGroupOwnerId: string;
        };
        DBShardGroup: {
            DBClusterIdentifier: string;
            ComputeRedundancy: string;
            DBShardGroupIdentifier: string;
            PubliclyAccessible: string;
            MaxACU: string;
            MinACU: string;
            Tags: string;
        };
        DBSubnetGroup: {
            DBSubnetGroupName: string;
            DBSubnetGroupDescription: string;
            SubnetIds: string;
            Tags: string;
        };
        EventSubscription: {
            SourceType: string;
            Enabled: string;
            EventCategories: string;
            SubscriptionName: string;
            SnsTopicArn: string;
            SourceIds: string;
            Tags: string;
        };
        GlobalCluster: {
            EngineLifecycleSupport: string;
            StorageEncrypted: string;
            EngineVersion: string;
            SourceDBClusterIdentifier: string;
            DeletionProtection: string;
            GlobalClusterIdentifier: string;
            Engine: string;
            Tags: string;
        };
        Integration: {
            DataFilter: string;
            IntegrationName: string;
            Description: string;
            KMSKeyId: string;
            SourceArn: string;
            TargetArn: string;
            AdditionalEncryptionContext: string;
            Tags: string;
        };
        OptionGroup: {
            OptionGroupDescription: string;
            OptionGroupName: string;
            OptionConfigurations: string;
            MajorEngineVersion: string;
            EngineName: string;
            Tags: string;
        };
    };
    RUM: {
        AppMonitor: {
            CustomEvents: string;
            CwLogEnabled: string;
            ResourcePolicy: string;
            DomainList: string;
            DeobfuscationConfiguration: string;
            Domain: string;
            AppMonitorConfiguration: string;
            Tags: string;
            Name: string;
        };
    };
    Rbin: {
        Rule: {
            Status: string;
            Description: string;
            ResourceTags: string;
            LockConfiguration: string;
            ExcludeResourceTags: string;
            ResourceType: string;
            RetentionPeriod: string;
            Tags: string;
        };
    };
    Redshift: {
        Cluster: {
            RevisionTarget: string;
            AutomatedSnapshotRetentionPeriod: string;
            Encrypted: string;
            Port: string;
            NumberOfNodes: string;
            DestinationRegion: string;
            AllowVersionUpgrade: string;
            Endpoint: string;
            NamespaceResourcePolicy: string;
            MaintenanceTrackName: string;
            OwnerAccount: string;
            MultiAZ: string;
            Tags: string;
            SnapshotClusterIdentifier: string;
            IamRoles: string;
            KmsKeyId: string;
            SnapshotCopyManual: string;
            ManageMasterPassword: string;
            AvailabilityZone: string;
            ClusterSecurityGroups: string;
            ClusterIdentifier: string;
            MasterUserPassword: string;
            ClusterSubnetGroupName: string;
            LoggingProperties: string;
            DeferMaintenance: string;
            NodeType: string;
            MasterUsername: string;
            PubliclyAccessible: string;
            ManualSnapshotRetentionPeriod: string;
            ResourceAction: string;
            HsmClientCertificateIdentifier: string;
            ElasticIp: string;
            AvailabilityZoneRelocationStatus: string;
            AquaConfigurationStatus: string;
            SnapshotIdentifier: string;
            AvailabilityZoneRelocation: string;
            SnapshotCopyGrantName: string;
            EnhancedVpcRouting: string;
            ClusterParameterGroupName: string;
            DeferMaintenanceEndTime: string;
            RotateEncryptionKey: string;
            VpcSecurityGroupIds: string;
            ClusterVersion: string;
            HsmConfigurationIdentifier: string;
            PreferredMaintenanceWindow: string;
            DeferMaintenanceStartTime: string;
            ClusterType: string;
            Classic: string;
            MasterPasswordSecretKmsKeyId: string;
            DeferMaintenanceDuration: string;
            DBName: string;
            SnapshotCopyRetentionPeriod: string;
        };
        ClusterParameterGroup: {
            Description: string;
            Parameters: string;
            ParameterGroupName: string;
            ParameterGroupFamily: string;
            Tags: string;
        };
        ClusterSecurityGroup: {
            Description: string;
            Tags: string;
        };
        ClusterSecurityGroupIngress: {
            CIDRIP: string;
            ClusterSecurityGroupName: string;
            EC2SecurityGroupName: string;
            EC2SecurityGroupOwnerId: string;
        };
        ClusterSubnetGroup: {
            Description: string;
            SubnetIds: string;
            Tags: string;
        };
        EndpointAccess: {
            EndpointName: string;
            VpcSecurityGroupIds: string;
            ResourceOwner: string;
            SubnetGroupName: string;
            ClusterIdentifier: string;
        };
        EndpointAuthorization: {
            Account: string;
            Force: string;
            VpcIds: string;
            ClusterIdentifier: string;
        };
        EventSubscription: {
            SourceType: string;
            EventCategories: string;
            Enabled: string;
            Severity: string;
            SubscriptionName: string;
            SourceIds: string;
            SnsTopicArn: string;
            Tags: string;
        };
        Integration: {
            IntegrationName: string;
            KMSKeyId: string;
            SourceArn: string;
            TargetArn: string;
            AdditionalEncryptionContext: string;
            Tags: string;
        };
        ScheduledAction: {
            ScheduledActionDescription: string;
            ScheduledActionName: string;
            EndTime: string;
            Schedule: string;
            IamRole: string;
            StartTime: string;
            Enable: string;
            TargetAction: string;
        };
    };
    RedshiftServerless: {
        Namespace: {
            ManageAdminPassword: string;
            IamRoles: string;
            SnapshotCopyConfigurations: string;
            KmsKeyId: string;
            FinalSnapshotName: string;
            FinalSnapshotRetentionPeriod: string;
            AdminUserPassword: string;
            AdminPasswordSecretKmsKeyId: string;
            DefaultIamRoleArn: string;
            AdminUsername: string;
            NamespaceName: string;
            NamespaceResourcePolicy: string;
            RedshiftIdcApplicationArn: string;
            DbName: string;
            Tags: string;
            LogExports: string;
        };
        Snapshot: {
            NamespaceName: string;
            RetentionPeriod: string;
            SnapshotName: string;
            Tags: string;
        };
        Workgroup: {
            SnapshotArn: string;
            SnapshotOwnerAccount: string;
            Port: string;
            RecoveryPointId: string;
            WorkgroupName: string;
            BaseCapacity: string;
            EnhancedVpcRouting: string;
            Workgroup: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            SnapshotName: string;
            NamespaceName: string;
            ConfigParameters: string;
            TrackName: string;
            PubliclyAccessible: string;
            PricePerformanceTarget: string;
            Tags: string;
            MaxCapacity: string;
        };
    };
    RefactorSpaces: {
        Application: {
            EnvironmentIdentifier: string;
            VpcId: string;
            ApiGatewayProxy: string;
            ProxyType: string;
            Tags: string;
            Name: string;
        };
        Environment: {
            Description: string;
            NetworkFabricType: string;
            Tags: string;
            Name: string;
        };
        Route: {
            UriPathRoute: string;
            EnvironmentIdentifier: string;
            RouteType: string;
            DefaultRoute: string;
            ServiceIdentifier: string;
            ApplicationIdentifier: string;
            Tags: string;
        };
        Service: {
            LambdaEndpoint: string;
            UrlEndpoint: string;
            Description: string;
            EnvironmentIdentifier: string;
            VpcId: string;
            EndpointType: string;
            ApplicationIdentifier: string;
            Tags: string;
            Name: string;
        };
    };
    Rekognition: {
        Collection: {
            CollectionId: string;
            Tags: string;
        };
        Project: {
            ProjectName: string;
        };
        StreamProcessor: {
            S3Destination: string;
            DataSharingPreference: string;
            KmsKeyId: string;
            FaceSearchSettings: string;
            PolygonRegionsOfInterest: string;
            RoleArn: string;
            Name: string;
            ConnectedHomeSettings: string;
            NotificationChannel: string;
            KinesisVideoStream: string;
            BoundingBoxRegionsOfInterest: string;
            KinesisDataStream: string;
            Tags: string;
        };
    };
    ResilienceHub: {
        App: {
            Description: string;
            AppTemplateBody: string;
            AppAssessmentSchedule: string;
            PermissionModel: string;
            ResourceMappings: string;
            EventSubscriptions: string;
            Tags: string;
            Name: string;
            ResiliencyPolicyArn: string;
        };
        ResiliencyPolicy: {
            Policy: string;
            PolicyDescription: string;
            Tier: string;
            PolicyName: string;
            DataLocationConstraint: string;
            Tags: string;
        };
    };
    ResourceExplorer2: {
        DefaultViewAssociation: {
            ViewArn: string;
        };
        Index: {
            Type: string;
            Tags: string;
        };
        View: {
            Filters: string;
            Scope: string;
            IncludedProperties: string;
            Tags: string;
            ViewName: string;
        };
    };
    ResourceGroups: {
        Group: {
            Description: string;
            Configuration: string;
            ResourceQuery: string;
            Resources: string;
            Tags: string;
            Name: string;
        };
        TagSyncTask: {
            Group: string;
            TagKey: string;
            TagValue: string;
            RoleArn: string;
        };
    };
    RoboMaker: {
        Fleet: {
            Tags: string;
            Name: string;
        };
        Robot: {
            Fleet: string;
            Architecture: string;
            GreengrassGroupId: string;
            Tags: string;
            Name: string;
        };
        RobotApplication: {
            CurrentRevisionId: string;
            Environment: string;
            RobotSoftwareSuite: string;
            Sources: string;
            Tags: string;
            Name: string;
        };
        RobotApplicationVersion: {
            CurrentRevisionId: string;
            Application: string;
        };
        SimulationApplication: {
            RenderingEngine: string;
            SimulationSoftwareSuite: string;
            CurrentRevisionId: string;
            Environment: string;
            RobotSoftwareSuite: string;
            Sources: string;
            Tags: string;
            Name: string;
        };
        SimulationApplicationVersion: {
            CurrentRevisionId: string;
            Application: string;
        };
    };
    RolesAnywhere: {
        CRL: {
            TrustAnchorArn: string;
            Enabled: string;
            CrlData: string;
            Tags: string;
            Name: string;
        };
        Profile: {
            ManagedPolicyArns: string;
            RequireInstanceProperties: string;
            RoleArns: string;
            AcceptRoleSessionName: string;
            SessionPolicy: string;
            AttributeMappings: string;
            Enabled: string;
            DurationSeconds: string;
            Tags: string;
            Name: string;
        };
        TrustAnchor: {
            NotificationSettings: string;
            Enabled: string;
            Source: string;
            Tags: string;
            Name: string;
        };
    };
    Route53: {
        CidrCollection: {
            Locations: string;
            Name: string;
        };
        DNSSEC: {
            HostedZoneId: string;
        };
        HealthCheck: {
            HealthCheckConfig: string;
            HealthCheckTags: string;
        };
        HostedZone: {
            HostedZoneTags: string;
            VPCs: string;
            HostedZoneConfig: string;
            QueryLoggingConfig: string;
            Name: string;
        };
        KeySigningKey: {
            Status: string;
            KeyManagementServiceArn: string;
            HostedZoneId: string;
            Name: string;
        };
        RecordSet: {
            AliasTarget: string;
            CidrRoutingConfig: string;
            Comment: string;
            Failover: string;
            GeoLocation: string;
            GeoProximityLocation: string;
            HealthCheckId: string;
            HostedZoneId: string;
            HostedZoneName: string;
            MultiValueAnswer: string;
            Name: string;
            Region: string;
            ResourceRecords: string;
            SetIdentifier: string;
            TTL: string;
            Type: string;
            Weight: string;
        };
        RecordSetGroup: {
            Comment: string;
            HostedZoneId: string;
            HostedZoneName: string;
            RecordSets: string;
        };
    };
    Route53Profiles: {
        Profile: {
            Tags: string;
            Name: string;
        };
        ProfileAssociation: {
            ProfileId: string;
            ResourceId: string;
            Arn: string;
            Tags: string;
            Name: string;
        };
        ProfileResourceAssociation: {
            ProfileId: string;
            ResourceArn: string;
            ResourceProperties: string;
            Name: string;
        };
    };
    Route53RecoveryControl: {
        Cluster: {
            NetworkType: string;
            Tags: string;
            Name: string;
        };
        ControlPanel: {
            ClusterArn: string;
            Tags: string;
            Name: string;
        };
        RoutingControl: {
            ClusterArn: string;
            ControlPanelArn: string;
            Name: string;
        };
        SafetyRule: {
            ControlPanelArn: string;
            AssertionRule: string;
            RuleConfig: string;
            GatingRule: string;
            Tags: string;
            Name: string;
        };
    };
    Route53RecoveryReadiness: {
        Cell: {
            CellName: string;
            Cells: string;
            Tags: string;
        };
        ReadinessCheck: {
            ResourceSetName: string;
            ReadinessCheckName: string;
            Tags: string;
        };
        RecoveryGroup: {
            RecoveryGroupName: string;
            Cells: string;
            Tags: string;
        };
        ResourceSet: {
            ResourceSetType: string;
            ResourceSetName: string;
            Resources: string;
            Tags: string;
        };
    };
    Route53Resolver: {
        FirewallDomainList: {
            Domains: string;
            DomainFileUrl: string;
            Tags: string;
            Name: string;
        };
        FirewallRuleGroup: {
            FirewallRules: string;
            Tags: string;
            Name: string;
        };
        FirewallRuleGroupAssociation: {
            VpcId: string;
            FirewallRuleGroupId: string;
            Priority: string;
            MutationProtection: string;
            Tags: string;
            Name: string;
        };
        OutpostResolver: {
            InstanceCount: string;
            OutpostArn: string;
            PreferredInstanceType: string;
            Tags: string;
            Name: string;
        };
        ResolverConfig: {
            ResourceId: string;
            AutodefinedReverseFlag: string;
        };
        ResolverDNSSECConfig: {
            ResourceId: string;
        };
        ResolverEndpoint: {
            IpAddresses: string;
            Protocols: string;
            OutpostArn: string;
            PreferredInstanceType: string;
            ResolverEndpointType: string;
            Direction: string;
            SecurityGroupIds: string;
            Tags: string;
            Name: string;
        };
        ResolverQueryLoggingConfig: {
            DestinationArn: string;
            Tags: string;
            Name: string;
        };
        ResolverQueryLoggingConfigAssociation: {
            ResourceId: string;
            ResolverQueryLogConfigId: string;
        };
        ResolverRule: {
            ResolverEndpointId: string;
            DomainName: string;
            RuleType: string;
            DelegationRecord: string;
            Tags: string;
            TargetIps: string;
            Name: string;
        };
        ResolverRuleAssociation: {
            VPCId: string;
            ResolverRuleId: string;
            Name: string;
        };
    };
    S3: {
        AccessGrant: {
            Grantee: string;
            AccessGrantsLocationConfiguration: string;
            ApplicationArn: string;
            Permission: string;
            S3PrefixType: string;
            Tags: string;
            AccessGrantsLocationId: string;
        };
        AccessGrantsInstance: {
            IdentityCenterArn: string;
            Tags: string;
        };
        AccessGrantsLocation: {
            LocationScope: string;
            IamRoleArn: string;
            Tags: string;
        };
        AccessPoint: {
            Policy: string;
            PublicAccessBlockConfiguration: string;
            Bucket: string;
            BucketAccountId: string;
            VpcConfiguration: string;
            Tags: string;
            Name: string;
        };
        Bucket: {
            InventoryConfigurations: string;
            BucketEncryption: string;
            WebsiteConfiguration: string;
            NotificationConfiguration: string;
            LifecycleConfiguration: string;
            VersioningConfiguration: string;
            MetricsConfigurations: string;
            AccessControl: string;
            MetadataTableConfiguration: string;
            IntelligentTieringConfigurations: string;
            AnalyticsConfigurations: string;
            AccelerateConfiguration: string;
            PublicAccessBlockConfiguration: string;
            BucketName: string;
            CorsConfiguration: string;
            OwnershipControls: string;
            ObjectLockConfiguration: string;
            ObjectLockEnabled: string;
            LoggingConfiguration: string;
            MetadataConfiguration: string;
            ReplicationConfiguration: string;
            Tags: string;
        };
        BucketPolicy: {
            Bucket: string;
            PolicyDocument: string;
        };
        MultiRegionAccessPoint: {
            PublicAccessBlockConfiguration: string;
            Regions: string;
            Name: string;
        };
        MultiRegionAccessPointPolicy: {
            Policy: string;
            MrapName: string;
        };
        StorageLens: {
            StorageLensConfiguration: string;
            Tags: string;
        };
        StorageLensGroup: {
            Filter: string;
            Tags: string;
            Name: string;
        };
    };
    S3Express: {
        AccessPoint: {
            Policy: string;
            PublicAccessBlockConfiguration: string;
            Scope: string;
            Bucket: string;
            BucketAccountId: string;
            VpcConfiguration: string;
            Tags: string;
            Name: string;
        };
        BucketPolicy: {
            Bucket: string;
            PolicyDocument: string;
        };
        DirectoryBucket: {
            BucketName: string;
            BucketEncryption: string;
            DataRedundancy: string;
            LifecycleConfiguration: string;
            Tags: string;
            LocationName: string;
        };
    };
    S3ObjectLambda: {
        AccessPoint: {
            ObjectLambdaConfiguration: string;
            Name: string;
        };
        AccessPointPolicy: {
            PolicyDocument: string;
            ObjectLambdaAccessPoint: string;
        };
    };
    S3Outposts: {
        AccessPoint: {
            Policy: string;
            Bucket: string;
            VpcConfiguration: string;
            Name: string;
        };
        Bucket: {
            OutpostId: string;
            BucketName: string;
            LifecycleConfiguration: string;
            Tags: string;
        };
        BucketPolicy: {
            Bucket: string;
            PolicyDocument: string;
        };
        Endpoint: {
            OutpostId: string;
            SecurityGroupId: string;
            FailedReason: string;
            SubnetId: string;
            AccessType: string;
            CustomerOwnedIpv4Pool: string;
        };
    };
    S3Tables: {
        Namespace: {
            TableBucketARN: string;
            Namespace: string;
        };
        Table: {
            WithoutMetadata: string;
            TableName: string;
            TableBucketARN: string;
            OpenTableFormat: string;
            IcebergMetadata: string;
            Compaction: string;
            Namespace: string;
            SnapshotManagement: string;
        };
        TableBucket: {
            TableBucketName: string;
            EncryptionConfiguration: string;
            UnreferencedFileRemoval: string;
        };
        TableBucketPolicy: {
            TableBucketARN: string;
            ResourcePolicy: string;
        };
        TablePolicy: {
            TableARN: string;
            ResourcePolicy: string;
        };
    };
    SDB: {
        Domain: {
            Description: string;
        };
    };
    SES: {
        ConfigurationSet: {
            SendingOptions: string;
            SuppressionOptions: string;
            TrackingOptions: string;
            ReputationOptions: string;
            VdmOptions: string;
            DeliveryOptions: string;
            Tags: string;
            Name: string;
        };
        ConfigurationSetEventDestination: {
            ConfigurationSetName: string;
            EventDestination: string;
        };
        ContactList: {
            Description: string;
            Topics: string;
            ContactListName: string;
            Tags: string;
        };
        DedicatedIpPool: {
            PoolName: string;
            ScalingMode: string;
            Tags: string;
        };
        EmailIdentity: {
            ConfigurationSetAttributes: string;
            EmailIdentity: string;
            DkimSigningAttributes: string;
            DkimAttributes: string;
            FeedbackAttributes: string;
            Tags: string;
            MailFromAttributes: string;
        };
        MailManagerAddonInstance: {
            AddonSubscriptionId: string;
            Tags: string;
        };
        MailManagerAddonSubscription: {
            AddonName: string;
            Tags: string;
        };
        MailManagerAddressList: {
            AddressListName: string;
            Tags: string;
        };
        MailManagerArchive: {
            KmsKeyArn: string;
            ArchiveName: string;
            Retention: string;
            Tags: string;
        };
        MailManagerIngressPoint: {
            RuleSetId: string;
            Type: string;
            TrafficPolicyId: string;
            IngressPointName: string;
            StatusToUpdate: string;
            NetworkConfiguration: string;
            Tags: string;
            IngressPointConfiguration: string;
        };
        MailManagerRelay: {
            Authentication: string;
            ServerName: string;
            RelayName: string;
            ServerPort: string;
            Tags: string;
        };
        MailManagerRuleSet: {
            RuleSetName: string;
            Rules: string;
            Tags: string;
        };
        MailManagerTrafficPolicy: {
            DefaultAction: string;
            PolicyStatements: string;
            TrafficPolicyName: string;
            MaxMessageSizeBytes: string;
            Tags: string;
        };
        ReceiptFilter: {
            Filter: string;
        };
        ReceiptRule: {
            After: string;
            Rule: string;
            RuleSetName: string;
        };
        ReceiptRuleSet: {
            RuleSetName: string;
        };
        Template: {
            Template: string;
        };
        VdmAttributes: {
            DashboardAttributes: string;
            GuardianAttributes: string;
        };
    };
    SMSVOICE: {
        ConfigurationSet: {
            EventDestinations: string;
            MessageFeedbackEnabled: string;
            ConfigurationSetName: string;
            DefaultSenderId: string;
            ProtectConfigurationId: string;
            Tags: string;
        };
        OptOutList: {
            OptOutListName: string;
            Tags: string;
        };
        PhoneNumber: {
            OptOutListName: string;
            SelfManagedOptOutsEnabled: string;
            NumberType: string;
            TwoWay: string;
            NumberCapabilities: string;
            MandatoryKeywords: string;
            OptionalKeywords: string;
            DeletionProtectionEnabled: string;
            IsoCountryCode: string;
            Tags: string;
        };
        Pool: {
            OptOutListName: string;
            SelfManagedOptOutsEnabled: string;
            SharedRoutesEnabled: string;
            OriginationIdentities: string;
            TwoWay: string;
            MandatoryKeywords: string;
            OptionalKeywords: string;
            DeletionProtectionEnabled: string;
            Tags: string;
        };
        ProtectConfiguration: {
            CountryRuleSet: string;
            DeletionProtectionEnabled: string;
            Tags: string;
        };
        ResourcePolicy: {
            ResourceArn: string;
            PolicyDocument: string;
        };
        SenderId: {
            SenderId: string;
            DeletionProtectionEnabled: string;
            IsoCountryCode: string;
            Tags: string;
        };
    };
    SNS: {
        Subscription: {
            ReplayPolicy: string;
            RawMessageDelivery: string;
            Endpoint: string;
            FilterPolicy: string;
            TopicArn: string;
            RedrivePolicy: string;
            DeliveryPolicy: string;
            Region: string;
            SubscriptionRoleArn: string;
            FilterPolicyScope: string;
            Protocol: string;
        };
        Topic: {
            KmsMasterKeyId: string;
            TracingConfig: string;
            FifoTopic: string;
            DataProtectionPolicy: string;
            TopicName: string;
            SignatureVersion: string;
            DeliveryStatusLogging: string;
            DisplayName: string;
            ContentBasedDeduplication: string;
            Subscription: string;
            FifoThroughputScope: string;
            Tags: string;
            ArchivePolicy: string;
        };
        TopicInlinePolicy: {
            TopicArn: string;
            PolicyDocument: string;
        };
        TopicPolicy: {
            Topics: string;
            PolicyDocument: string;
        };
    };
    SQS: {
        Queue: {
            ReceiveMessageWaitTimeSeconds: string;
            FifoThroughputLimit: string;
            KmsMasterKeyId: string;
            FifoQueue: string;
            MaximumMessageSize: string;
            VisibilityTimeout: string;
            KmsDataKeyReusePeriodSeconds: string;
            RedriveAllowPolicy: string;
            SqsManagedSseEnabled: string;
            DelaySeconds: string;
            RedrivePolicy: string;
            MessageRetentionPeriod: string;
            DeduplicationScope: string;
            ContentBasedDeduplication: string;
            QueueName: string;
            Tags: string;
        };
        QueueInlinePolicy: {
            PolicyDocument: string;
            Queue: string;
        };
        QueuePolicy: {
            PolicyDocument: string;
            Queues: string;
        };
    };
    SSM: {
        Association: {
            AssociationName: string;
            CalendarNames: string;
            ScheduleExpression: string;
            MaxErrors: string;
            Parameters: string;
            InstanceId: string;
            WaitForSuccessTimeoutSeconds: string;
            MaxConcurrency: string;
            ComplianceSeverity: string;
            Targets: string;
            SyncCompliance: string;
            OutputLocation: string;
            ScheduleOffset: string;
            Name: string;
            ApplyOnlyAtCronInterval: string;
            DocumentVersion: string;
            AutomationTargetParameterName: string;
        };
        Document: {
            DocumentFormat: string;
            Requires: string;
            Content: string;
            TargetType: string;
            DocumentType: string;
            VersionName: string;
            UpdateMethod: string;
            Attachments: string;
            Tags: string;
            Name: string;
        };
        MaintenanceWindow: {
            StartDate: string;
            Description: string;
            AllowUnassociatedTargets: string;
            Cutoff: string;
            Schedule: string;
            Duration: string;
            ScheduleOffset: string;
            EndDate: string;
            Tags: string;
            Name: string;
            ScheduleTimezone: string;
        };
        MaintenanceWindowTarget: {
            OwnerInformation: string;
            Description: string;
            WindowId: string;
            ResourceType: string;
            Targets: string;
            Name: string;
        };
        MaintenanceWindowTask: {
            MaxErrors: string;
            Description: string;
            ServiceRoleArn: string;
            Priority: string;
            MaxConcurrency: string;
            Targets: string;
            Name: string;
            TaskArn: string;
            TaskInvocationParameters: string;
            WindowId: string;
            TaskParameters: string;
            TaskType: string;
            CutoffBehavior: string;
            LoggingInfo: string;
        };
        Parameter: {
            Type: string;
            Description: string;
            Policies: string;
            AllowedPattern: string;
            Tier: string;
            Value: string;
            DataType: string;
            Tags: string;
            Name: string;
        };
        PatchBaseline: {
            OperatingSystem: string;
            Description: string;
            ApprovalRules: string;
            Sources: string;
            Name: string;
            RejectedPatches: string;
            ApprovedPatches: string;
            RejectedPatchesAction: string;
            PatchGroups: string;
            ApprovedPatchesComplianceLevel: string;
            AvailableSecurityUpdatesComplianceStatus: string;
            ApprovedPatchesEnableNonSecurity: string;
            DefaultBaseline: string;
            GlobalFilters: string;
            Tags: string;
        };
        ResourceDataSync: {
            S3Destination: string;
            KMSKeyArn: string;
            SyncSource: string;
            BucketName: string;
            BucketRegion: string;
            SyncFormat: string;
            SyncName: string;
            SyncType: string;
            BucketPrefix: string;
        };
        ResourcePolicy: {
            Policy: string;
            ResourceArn: string;
        };
    };
    SSMContacts: {
        Contact: {
            Type: string;
            Alias: string;
            DisplayName: string;
            Plan: string;
            Tags: string;
        };
        ContactChannel: {
            ChannelName: string;
            ChannelAddress: string;
            ContactId: string;
            ChannelType: string;
            DeferActivation: string;
        };
        Plan: {
            RotationIds: string;
            Stages: string;
            ContactId: string;
        };
        Rotation: {
            Recurrence: string;
            TimeZoneId: string;
            StartTime: string;
            Tags: string;
            Name: string;
            ContactIds: string;
        };
    };
    SSMGuiConnect: {
        Preferences: {
            ConnectionRecordingPreferences: string;
        };
    };
    SSMIncidents: {
        ReplicationSet: {
            Regions: string;
            DeletionProtected: string;
            Tags: string;
        };
        ResponsePlan: {
            ChatChannel: string;
            Integrations: string;
            Actions: string;
            DisplayName: string;
            IncidentTemplate: string;
            Engagements: string;
            Tags: string;
            Name: string;
        };
    };
    SSMQuickSetup: {
        ConfigurationManager: {
            Description: string;
            ConfigurationDefinitions: string;
            Tags: string;
            Name: string;
        };
    };
    SSO: {
        Application: {
            Status: string;
            ApplicationProviderArn: string;
            PortalOptions: string;
            Description: string;
            InstanceArn: string;
            Tags: string;
            Name: string;
        };
        ApplicationAssignment: {
            ApplicationArn: string;
            PrincipalId: string;
            PrincipalType: string;
        };
        Assignment: {
            PrincipalId: string;
            InstanceArn: string;
            TargetType: string;
            PermissionSetArn: string;
            PrincipalType: string;
            TargetId: string;
        };
        Instance: {
            Tags: string;
            Name: string;
        };
        InstanceAccessControlAttributeConfiguration: {
            InstanceArn: string;
            AccessControlAttributes: string;
        };
        PermissionSet: {
            RelayStateType: string;
            CustomerManagedPolicyReferences: string;
            SessionDuration: string;
            Description: string;
            InstanceArn: string;
            InlinePolicy: string;
            ManagedPolicies: string;
            Tags: string;
            Name: string;
            PermissionsBoundary: string;
        };
    };
    SageMaker: {
        App: {
            RecoveryMode: string;
            DomainId: string;
            ResourceSpec: string;
            AppType: string;
            Tags: string;
            UserProfileName: string;
            AppName: string;
        };
        AppImageConfig: {
            KernelGatewayImageConfig: string;
            CodeEditorAppImageConfig: string;
            AppImageConfigName: string;
            JupyterLabAppImageConfig: string;
            Tags: string;
        };
        Cluster: {
            VpcConfig: string;
            NodeRecovery: string;
            NodeProvisioningMode: string;
            InstanceGroups: string;
            RestrictedInstanceGroups: string;
            ClusterName: string;
            Orchestrator: string;
            AutoScaling: string;
            ClusterRole: string;
            Tags: string;
        };
        CodeRepository: {
            CodeRepositoryName: string;
            GitConfig: string;
            Tags: string;
        };
        DataQualityJobDefinition: {
            DataQualityJobInput: string;
            DataQualityAppSpecification: string;
            EndpointName: string;
            StoppingCondition: string;
            JobDefinitionName: string;
            JobResources: string;
            NetworkConfig: string;
            DataQualityJobOutputConfig: string;
            DataQualityBaselineConfig: string;
            RoleArn: string;
            Tags: string;
        };
        Device: {
            DeviceFleetName: string;
            Device: string;
            Tags: string;
        };
        DeviceFleet: {
            DeviceFleetName: string;
            Description: string;
            OutputConfig: string;
            RoleArn: string;
            Tags: string;
        };
        Domain: {
            AppNetworkAccessType: string;
            DefaultSpaceSettings: string;
            KmsKeyId: string;
            VpcId: string;
            DomainName: string;
            AppSecurityGroupManagement: string;
            DefaultUserSettings: string;
            SubnetIds: string;
            AuthMode: string;
            Tags: string;
            DomainSettings: string;
            TagPropagation: string;
        };
        Endpoint: {
            RetainAllVariantProperties: string;
            EndpointName: string;
            ExcludeRetainedVariantProperties: string;
            EndpointConfigName: string;
            DeploymentConfig: string;
            RetainDeploymentConfig: string;
            Tags: string;
        };
        EndpointConfig: {
            ShadowProductionVariants: string;
            DataCaptureConfig: string;
            ExecutionRoleArn: string;
            EnableNetworkIsolation: string;
            ProductionVariants: string;
            KmsKeyId: string;
            AsyncInferenceConfig: string;
            VpcConfig: string;
            EndpointConfigName: string;
            ExplainerConfig: string;
            Tags: string;
        };
        FeatureGroup: {
            ThroughputConfig: string;
            Description: string;
            OfflineStoreConfig: string;
            FeatureDefinitions: string;
            RecordIdentifierFeatureName: string;
            EventTimeFeatureName: string;
            FeatureGroupName: string;
            OnlineStoreConfig: string;
            RoleArn: string;
            Tags: string;
        };
        Image: {
            ImageName: string;
            ImageDisplayName: string;
            ImageRoleArn: string;
            ImageDescription: string;
            Tags: string;
        };
        ImageVersion: {
            ImageName: string;
            Horovod: string;
            Processor: string;
            JobType: string;
            Alias: string;
            ProgrammingLang: string;
            VendorGuidance: string;
            MLFramework: string;
            Aliases: string;
            ReleaseNotes: string;
            BaseImage: string;
        };
        InferenceComponent: {
            EndpointName: string;
            VariantName: string;
            InferenceComponentName: string;
            Specification: string;
            RuntimeConfig: string;
            DeploymentConfig: string;
            EndpointArn: string;
            Tags: string;
        };
        InferenceExperiment: {
            DataStorageConfig: string;
            Description: string;
            StatusReason: string;
            ModelVariants: string;
            ShadowModeConfig: string;
            RoleArn: string;
            Name: string;
            Type: string;
            EndpointName: string;
            DesiredState: string;
            Schedule: string;
            KmsKey: string;
            Tags: string;
        };
        MlflowTrackingServer: {
            TrackingServerName: string;
            MlflowVersion: string;
            WeeklyMaintenanceWindowStart: string;
            TrackingServerSize: string;
            ArtifactStoreUri: string;
            AutomaticModelRegistration: string;
            RoleArn: string;
            Tags: string;
        };
        Model: {
            ExecutionRoleArn: string;
            EnableNetworkIsolation: string;
            PrimaryContainer: string;
            ModelName: string;
            VpcConfig: string;
            Containers: string;
            InferenceExecutionConfig: string;
            Tags: string;
        };
        ModelBiasJobDefinition: {
            ModelBiasJobInput: string;
            ModelBiasJobOutputConfig: string;
            EndpointName: string;
            StoppingCondition: string;
            JobDefinitionName: string;
            JobResources: string;
            NetworkConfig: string;
            ModelBiasBaselineConfig: string;
            ModelBiasAppSpecification: string;
            RoleArn: string;
            Tags: string;
        };
        ModelCard: {
            LastModifiedBy: string;
            ModelCardName: string;
            ModelCardStatus: string;
            CreatedBy: string;
            SecurityConfig: string;
            Content: string;
            Tags: string;
        };
        ModelExplainabilityJobDefinition: {
            ModelExplainabilityJobOutputConfig: string;
            EndpointName: string;
            StoppingCondition: string;
            ModelExplainabilityBaselineConfig: string;
            JobDefinitionName: string;
            JobResources: string;
            NetworkConfig: string;
            RoleArn: string;
            ModelExplainabilityJobInput: string;
            Tags: string;
            ModelExplainabilityAppSpecification: string;
        };
        ModelPackage: {
            DriftCheckBaselines: string;
            ModelMetrics: string;
            Task: string;
            CustomerMetadataProperties: string;
            SourceUri: string;
            ModelApprovalStatus: string;
            ModelPackageVersion: string;
            MetadataProperties: string;
            SourceAlgorithmSpecification: string;
            ModelPackageStatusDetails: string;
            ModelPackageDescription: string;
            AdditionalInferenceSpecificationsToAdd: string;
            SecurityConfig: string;
            InferenceSpecification: string;
            SamplePayloadUrl: string;
            Tags: string;
            CertifyForMarketplace: string;
            ModelPackageGroupName: string;
            ApprovalDescription: string;
            ModelCard: string;
            ValidationSpecification: string;
            SkipModelValidation: string;
            ModelPackageName: string;
            LastModifiedTime: string;
            ClientToken: string;
            Domain: string;
            AdditionalInferenceSpecifications: string;
        };
        ModelPackageGroup: {
            ModelPackageGroupName: string;
            ModelPackageGroupDescription: string;
            ModelPackageGroupPolicy: string;
            Tags: string;
        };
        ModelQualityJobDefinition: {
            ModelQualityAppSpecification: string;
            EndpointName: string;
            StoppingCondition: string;
            ModelQualityBaselineConfig: string;
            JobDefinitionName: string;
            ModelQualityJobInput: string;
            JobResources: string;
            NetworkConfig: string;
            ModelQualityJobOutputConfig: string;
            RoleArn: string;
            Tags: string;
        };
        MonitoringSchedule: {
            MonitoringScheduleStatus: string;
            MonitoringScheduleConfig: string;
            MonitoringScheduleName: string;
            EndpointName: string;
            FailureReason: string;
            LastMonitoringExecutionSummary: string;
            Tags: string;
        };
        NotebookInstance: {
            KmsKeyId: string;
            VolumeSizeInGB: string;
            AdditionalCodeRepositories: string;
            DefaultCodeRepository: string;
            DirectInternetAccess: string;
            PlatformIdentifier: string;
            AcceleratorTypes: string;
            SubnetId: string;
            SecurityGroupIds: string;
            RoleArn: string;
            InstanceMetadataServiceConfiguration: string;
            RootAccess: string;
            NotebookInstanceName: string;
            InstanceType: string;
            LifecycleConfigName: string;
            Tags: string;
        };
        NotebookInstanceLifecycleConfig: {
            OnStart: string;
            NotebookInstanceLifecycleConfigName: string;
            OnCreate: string;
        };
        PartnerApp: {
            ExecutionRoleArn: string;
            Type: string;
            KmsKeyId: string;
            EnableIamSessionBasedIdentity: string;
            Tier: string;
            ApplicationConfig: string;
            AuthType: string;
            MaintenanceConfig: string;
            Tags: string;
            Name: string;
        };
        Pipeline: {
            PipelineName: string;
            ParallelismConfiguration: string;
            PipelineDescription: string;
            PipelineDisplayName: string;
            PipelineDefinition: string;
            RoleArn: string;
            Tags: string;
        };
        ProcessingJob: {
            ProcessingResources: string;
            StoppingCondition: string;
            ExperimentConfig: string;
            ProcessingInputs: string;
            NetworkConfig: string;
            ProcessingOutputConfig: string;
            Environment: string;
            AppSpecification: string;
            ProcessingJobName: string;
            RoleArn: string;
            Tags: string;
        };
        Project: {
            ProjectName: string;
            TemplateProviderDetails: string;
            ServiceCatalogProvisionedProductDetails: string;
            ServiceCatalogProvisioningDetails: string;
            ProjectDescription: string;
            Tags: string;
        };
        Space: {
            DomainId: string;
            SpaceName: string;
            SpaceSettings: string;
            SpaceDisplayName: string;
            Tags: string;
            SpaceSharingSettings: string;
            OwnershipSettings: string;
        };
        StudioLifecycleConfig: {
            StudioLifecycleConfigAppType: string;
            StudioLifecycleConfigName: string;
            StudioLifecycleConfigContent: string;
            Tags: string;
        };
        UserProfile: {
            DomainId: string;
            SingleSignOnUserValue: string;
            UserSettings: string;
            SingleSignOnUserIdentifier: string;
            UserProfileName: string;
            Tags: string;
        };
        Workteam: {
            Description: string;
            NotificationConfiguration: string;
            WorkteamName: string;
            MemberDefinitions: string;
            WorkforceName: string;
            Tags: string;
        };
    };
    Scheduler: {
        Schedule: {
            GroupName: string;
            StartDate: string;
            ScheduleExpression: string;
            Target: string;
            Description: string;
            KmsKeyArn: string;
            State: string;
            FlexibleTimeWindow: string;
            ScheduleExpressionTimezone: string;
            EndDate: string;
            Name: string;
        };
        ScheduleGroup: {
            Tags: string;
            Name: string;
        };
    };
    SecretsManager: {
        ResourcePolicy: {
            BlockPublicPolicy: string;
            SecretId: string;
            ResourcePolicy: string;
        };
        RotationSchedule: {
            HostedRotationLambda: string;
            SecretId: string;
            RotateImmediatelyOnUpdate: string;
            RotationLambdaARN: string;
            RotationRules: string;
        };
        Secret: {
            Description: string;
            KmsKeyId: string;
            SecretString: string;
            GenerateSecretString: string;
            ReplicaRegions: string;
            Tags: string;
            Name: string;
        };
        SecretTargetAttachment: {
            SecretId: string;
            TargetType: string;
            TargetId: string;
        };
    };
    SecurityHub: {
        AggregatorV2: {
            RegionLinkingMode: string;
            LinkedRegions: string;
            Tags: string;
        };
        AutomationRule: {
            Description: string;
            Actions: string;
            IsTerminal: string;
            RuleStatus: string;
            Criteria: string;
            RuleOrder: string;
            RuleName: string;
            Tags: string;
        };
        AutomationRuleV2: {
            Description: string;
            Actions: string;
            RuleStatus: string;
            Criteria: string;
            RuleOrder: string;
            RuleName: string;
            Tags: string;
        };
        ConfigurationPolicy: {
            Description: string;
            ConfigurationPolicy: string;
            Tags: string;
            Name: string;
        };
        DelegatedAdmin: {
            AdminAccountId: string;
        };
        FindingAggregator: {
            RegionLinkingMode: string;
            Regions: string;
        };
        Hub: {
            ControlFindingGenerator: string;
            EnableDefaultStandards: string;
            AutoEnableControls: string;
            Tags: string;
        };
        HubV2: {
            Tags: string;
        };
        Insight: {
            Filters: string;
            GroupByAttribute: string;
            Name: string;
        };
        OrganizationConfiguration: {
            AutoEnable: string;
            ConfigurationType: string;
            AutoEnableStandards: string;
        };
        PolicyAssociation: {
            ConfigurationPolicyId: string;
            TargetType: string;
            TargetId: string;
        };
        ProductSubscription: {
            ProductArn: string;
        };
        SecurityControl: {
            SecurityControlId: string;
            LastUpdateReason: string;
            Parameters: string;
            SecurityControlArn: string;
        };
        Standard: {
            StandardsArn: string;
            DisabledStandardsControls: string;
        };
    };
    SecurityLake: {
        AwsLogSource: {
            SourceName: string;
            SourceVersion: string;
            Accounts: string;
            DataLakeArn: string;
        };
        DataLake: {
            EncryptionConfiguration: string;
            LifecycleConfiguration: string;
            ReplicationConfiguration: string;
            MetaStoreManagerRoleArn: string;
            Tags: string;
        };
        Subscriber: {
            SubscriberIdentity: string;
            SubscriberName: string;
            SubscriberDescription: string;
            AccessTypes: string;
            Sources: string;
            DataLakeArn: string;
            Tags: string;
        };
        SubscriberNotification: {
            SubscriberArn: string;
            NotificationConfiguration: string;
        };
    };
    ServiceCatalog: {
        AcceptedPortfolioShare: {
            AcceptLanguage: string;
            PortfolioId: string;
        };
        CloudFormationProduct: {
            Owner: string;
            Description: string;
            SupportEmail: string;
            ProductType: string;
            Name: string;
            ReplaceProvisioningArtifacts: string;
            SupportDescription: string;
            Distributor: string;
            AcceptLanguage: string;
            SupportUrl: string;
            SourceConnection: string;
            Tags: string;
            ProvisioningArtifactParameters: string;
        };
        CloudFormationProvisionedProduct: {
            PathId: string;
            ProvisioningParameters: string;
            ProvisioningPreferences: string;
            ProductName: string;
            ProvisioningArtifactName: string;
            NotificationArns: string;
            AcceptLanguage: string;
            ProductId: string;
            PathName: string;
            Tags: string;
            ProvisionedProductName: string;
            ProvisioningArtifactId: string;
        };
        LaunchNotificationConstraint: {
            Description: string;
            NotificationArns: string;
            AcceptLanguage: string;
            PortfolioId: string;
            ProductId: string;
        };
        LaunchRoleConstraint: {
            Description: string;
            LocalRoleName: string;
            AcceptLanguage: string;
            PortfolioId: string;
            ProductId: string;
            RoleArn: string;
        };
        LaunchTemplateConstraint: {
            Description: string;
            AcceptLanguage: string;
            PortfolioId: string;
            ProductId: string;
            Rules: string;
        };
        Portfolio: {
            ProviderName: string;
            Description: string;
            DisplayName: string;
            AcceptLanguage: string;
            Tags: string;
        };
        PortfolioPrincipalAssociation: {
            PrincipalARN: string;
            AcceptLanguage: string;
            PortfolioId: string;
            PrincipalType: string;
        };
        PortfolioProductAssociation: {
            SourcePortfolioId: string;
            AcceptLanguage: string;
            PortfolioId: string;
            ProductId: string;
        };
        PortfolioShare: {
            AccountId: string;
            AcceptLanguage: string;
            PortfolioId: string;
            ShareTagOptions: string;
        };
        ResourceUpdateConstraint: {
            Description: string;
            AcceptLanguage: string;
            TagUpdateOnProvisionedProduct: string;
            PortfolioId: string;
            ProductId: string;
        };
        ServiceAction: {
            Description: string;
            Definition: string;
            AcceptLanguage: string;
            DefinitionType: string;
            Name: string;
        };
        ServiceActionAssociation: {
            ServiceActionId: string;
            ProductId: string;
            ProvisioningArtifactId: string;
        };
        StackSetConstraint: {
            Description: string;
            StackInstanceControl: string;
            AcceptLanguage: string;
            PortfolioId: string;
            ProductId: string;
            RegionList: string;
            AdminRole: string;
            AccountList: string;
            ExecutionRole: string;
        };
        TagOption: {
            Active: string;
            Value: string;
            Key: string;
        };
        TagOptionAssociation: {
            TagOptionId: string;
            ResourceId: string;
        };
    };
    ServiceCatalogAppRegistry: {
        Application: {
            Description: string;
            Tags: string;
            Name: string;
        };
        AttributeGroup: {
            Description: string;
            Attributes: string;
            Tags: string;
            Name: string;
        };
        AttributeGroupAssociation: {
            AttributeGroup: string;
            Application: string;
        };
        ResourceAssociation: {
            Resource: string;
            ResourceType: string;
            Application: string;
        };
    };
    ServiceDiscovery: {
        HttpNamespace: {
            Description: string;
            Tags: string;
            Name: string;
        };
        Instance: {
            InstanceAttributes: string;
            InstanceId: string;
            ServiceId: string;
        };
        PrivateDnsNamespace: {
            Description: string;
            Vpc: string;
            Properties: string;
            Tags: string;
            Name: string;
        };
        PublicDnsNamespace: {
            Description: string;
            Properties: string;
            Tags: string;
            Name: string;
        };
        Service: {
            Type: string;
            Description: string;
            HealthCheckCustomConfig: string;
            DnsConfig: string;
            ServiceAttributes: string;
            NamespaceId: string;
            HealthCheckConfig: string;
            Tags: string;
            Name: string;
        };
    };
    Shield: {
        DRTAccess: {
            LogBucketList: string;
            RoleArn: string;
        };
        ProactiveEngagement: {
            ProactiveEngagementStatus: string;
            EmergencyContactList: string;
        };
        Protection: {
            ResourceArn: string;
            HealthCheckArns: string;
            ApplicationLayerAutomaticResponseConfiguration: string;
            Tags: string;
            Name: string;
        };
        ProtectionGroup: {
            Aggregation: string;
            Pattern: string;
            ProtectionGroupId: string;
            ResourceType: string;
            Members: string;
            Tags: string;
        };
    };
    Signer: {
        ProfilePermission: {
            Action: string;
            StatementId: string;
            ProfileName: string;
            Principal: string;
            ProfileVersion: string;
        };
        SigningProfile: {
            SignatureValidityPeriod: string;
            PlatformId: string;
            Tags: string;
        };
    };
    SimSpaceWeaver: {
        Simulation: {
            SchemaS3Location: string;
            SnapshotS3Location: string;
            MaximumDuration: string;
            RoleArn: string;
            Name: string;
        };
    };
    StepFunctions: {
        Activity: {
            EncryptionConfiguration: string;
            Tags: string;
            Name: string;
        };
        StateMachine: {
            EncryptionConfiguration: string;
            DefinitionString: string;
            LoggingConfiguration: string;
            DefinitionSubstitutions: string;
            Definition: string;
            DefinitionS3Location: string;
            StateMachineName: string;
            RoleArn: string;
            Tags: string;
            StateMachineType: string;
            TracingConfiguration: string;
        };
        StateMachineAlias: {
            Description: string;
            RoutingConfiguration: string;
            DeploymentPreference: string;
            Name: string;
        };
        StateMachineVersion: {
            Description: string;
            StateMachineRevisionId: string;
            StateMachineArn: string;
        };
    };
    SupportApp: {
        AccountAlias: {
            AccountAlias: string;
        };
        SlackChannelConfiguration: {
            ChannelName: string;
            NotifyOnAddCorrespondenceToCase: string;
            ChannelRoleArn: string;
            NotifyOnResolveCase: string;
            NotifyOnCaseSeverity: string;
            TeamId: string;
            ChannelId: string;
            NotifyOnCreateOrReopenCase: string;
        };
        SlackWorkspaceConfiguration: {
            VersionId: string;
            TeamId: string;
        };
    };
    Synthetics: {
        Canary: {
            BrowserConfigs: string;
            VisualReferences: string;
            ArtifactConfig: string;
            SuccessRetentionPeriod: string;
            RuntimeVersion: string;
            VPCConfig: string;
            RunConfig: string;
            DryRunAndUpdate: string;
            FailureRetentionPeriod: string;
            Code: string;
            ResourcesToReplicateTags: string;
            Name: string;
            ProvisionedResourceCleanup: string;
            ExecutionRoleArn: string;
            Schedule: string;
            ArtifactS3Location: string;
            Tags: string;
            StartCanaryAfterCreation: string;
        };
        Group: {
            ResourceArns: string;
            Tags: string;
            Name: string;
        };
    };
    SystemsManagerSAP: {
        Application: {
            Instances: string;
            ApplicationType: string;
            DatabaseArn: string;
            SapInstanceNumber: string;
            ApplicationId: string;
            Credentials: string;
            Tags: string;
            ComponentsInfo: string;
            Sid: string;
        };
    };
    Timestream: {
        Database: {
            KmsKeyId: string;
            DatabaseName: string;
            Tags: string;
        };
        InfluxDBInstance: {
            DbParameterGroupIdentifier: string;
            Organization: string;
            Port: string;
            DbInstanceType: string;
            VpcSubnetIds: string;
            DeploymentType: string;
            AllocatedStorage: string;
            Name: string;
            DbStorageType: string;
            LogDeliveryConfiguration: string;
            Username: string;
            Bucket: string;
            VpcSecurityGroupIds: string;
            NetworkType: string;
            PubliclyAccessible: string;
            Tags: string;
            Password: string;
        };
        ScheduledQuery: {
            ScheduledQueryExecutionRoleArn: string;
            ErrorReportConfiguration: string;
            ScheduleConfiguration: string;
            TargetConfiguration: string;
            KmsKeyId: string;
            QueryString: string;
            NotificationConfiguration: string;
            ScheduledQueryName: string;
            ClientToken: string;
            Tags: string;
        };
        Table: {
            TableName: string;
            RetentionProperties: string;
            Schema: string;
            DatabaseName: string;
            Tags: string;
            MagneticStoreWriteProperties: string;
        };
    };
    Transfer: {
        Agreement: {
            Status: string;
            Description: string;
            BaseDirectory: string;
            ServerId: string;
            CustomDirectories: string;
            AccessRole: string;
            PartnerProfileId: string;
            LocalProfileId: string;
            EnforceMessageSigning: string;
            PreserveFilename: string;
            Tags: string;
        };
        Certificate: {
            InactiveDate: string;
            Usage: string;
            PrivateKey: string;
            Description: string;
            CertificateChain: string;
            ActiveDate: string;
            Tags: string;
            Certificate: string;
        };
        Connector: {
            As2Config: string;
            LoggingRole: string;
            AccessRole: string;
            SecurityPolicyName: string;
            SftpConfig: string;
            Tags: string;
            Url: string;
        };
        Profile: {
            As2Id: string;
            ProfileType: string;
            CertificateIds: string;
            Tags: string;
        };
        Server: {
            IpAddressType: string;
            LoggingRole: string;
            Protocols: string;
            IdentityProviderDetails: string;
            EndpointDetails: string;
            StructuredLogDestinations: string;
            PreAuthenticationLoginBanner: string;
            PostAuthenticationLoginBanner: string;
            EndpointType: string;
            SecurityPolicyName: string;
            ProtocolDetails: string;
            S3StorageOptions: string;
            WorkflowDetails: string;
            Domain: string;
            IdentityProviderType: string;
            Tags: string;
            Certificate: string;
        };
        User: {
            Policy: string;
            Role: string;
            HomeDirectory: string;
            HomeDirectoryType: string;
            ServerId: string;
            UserName: string;
            HomeDirectoryMappings: string;
            PosixProfile: string;
            SshPublicKeys: string;
            Tags: string;
        };
        WebApp: {
            WebAppCustomization: string;
            IdentityProviderDetails: string;
            WebAppUnits: string;
            WebAppEndpointPolicy: string;
            Tags: string;
            AccessEndpoint: string;
        };
        Workflow: {
            Steps: string;
            Description: string;
            OnExceptionSteps: string;
            Tags: string;
        };
    };
    VerifiedPermissions: {
        IdentitySource: {
            PrincipalEntityType: string;
            Configuration: string;
            PolicyStoreId: string;
        };
        Policy: {
            Definition: string;
            PolicyStoreId: string;
        };
        PolicyStore: {
            Description: string;
            ValidationSettings: string;
            Schema: string;
            DeletionProtection: string;
            Tags: string;
        };
        PolicyTemplate: {
            Description: string;
            Statement: string;
            PolicyStoreId: string;
        };
    };
    VoiceID: {
        Domain: {
            Description: string;
            ServerSideEncryptionConfiguration: string;
            Tags: string;
            Name: string;
        };
    };
    VpcLattice: {
        AccessLogSubscription: {
            ResourceIdentifier: string;
            ServiceNetworkLogType: string;
            DestinationArn: string;
            Tags: string;
        };
        AuthPolicy: {
            Policy: string;
            ResourceIdentifier: string;
        };
        Listener: {
            DefaultAction: string;
            Port: string;
            ServiceIdentifier: string;
            Protocol: string;
            Tags: string;
            Name: string;
        };
        ResourceConfiguration: {
            AllowAssociationToSharableServiceNetwork: string;
            ProtocolType: string;
            ResourceConfigurationType: string;
            PortRanges: string;
            ResourceConfigurationDefinition: string;
            ResourceGatewayId: string;
            ResourceConfigurationAuthType: string;
            ResourceConfigurationGroupId: string;
            Tags: string;
            Name: string;
        };
        ResourceGateway: {
            IpAddressType: string;
            VpcIdentifier: string;
            SubnetIds: string;
            SecurityGroupIds: string;
            Tags: string;
            Name: string;
        };
        ResourcePolicy: {
            Policy: string;
            ResourceArn: string;
        };
        Rule: {
            Action: string;
            Priority: string;
            ServiceIdentifier: string;
            ListenerIdentifier: string;
            Tags: string;
            Match: string;
            Name: string;
        };
        Service: {
            DnsEntry: string;
            CustomDomainName: string;
            AuthType: string;
            Tags: string;
            Name: string;
            CertificateArn: string;
        };
        ServiceNetwork: {
            SharingConfig: string;
            AuthType: string;
            Tags: string;
            Name: string;
        };
        ServiceNetworkResourceAssociation: {
            ResourceConfigurationId: string;
            ServiceNetworkId: string;
            Tags: string;
        };
        ServiceNetworkServiceAssociation: {
            ServiceNetworkIdentifier: string;
            DnsEntry: string;
            ServiceIdentifier: string;
            Tags: string;
        };
        ServiceNetworkVpcAssociation: {
            ServiceNetworkIdentifier: string;
            VpcIdentifier: string;
            SecurityGroupIds: string;
            Tags: string;
        };
        TargetGroup: {
            Type: string;
            Config: string;
            Targets: string;
            Tags: string;
            Name: string;
        };
    };
    WAF: {
        ByteMatchSet: {
            ByteMatchTuples: string;
            Name: string;
        };
        IPSet: {
            IPSetDescriptors: string;
            Name: string;
        };
        Rule: {
            MetricName: string;
            Name: string;
            Predicates: string;
        };
        SizeConstraintSet: {
            Name: string;
            SizeConstraints: string;
        };
        SqlInjectionMatchSet: {
            Name: string;
            SqlInjectionMatchTuples: string;
        };
        WebACL: {
            DefaultAction: string;
            MetricName: string;
            Name: string;
            Rules: string;
        };
        XssMatchSet: {
            Name: string;
            XssMatchTuples: string;
        };
    };
    WAFRegional: {
        ByteMatchSet: {
            ByteMatchTuples: string;
            Name: string;
        };
        GeoMatchSet: {
            GeoMatchConstraints: string;
            Name: string;
        };
        IPSet: {
            IPSetDescriptors: string;
            Name: string;
        };
        RateBasedRule: {
            MetricName: string;
            RateLimit: string;
            MatchPredicates: string;
            RateKey: string;
            Name: string;
        };
        RegexPatternSet: {
            RegexPatternStrings: string;
            Name: string;
        };
        Rule: {
            MetricName: string;
            Predicates: string;
            Name: string;
        };
        SizeConstraintSet: {
            SizeConstraints: string;
            Name: string;
        };
        SqlInjectionMatchSet: {
            SqlInjectionMatchTuples: string;
            Name: string;
        };
        WebACL: {
            MetricName: string;
            DefaultAction: string;
            Rules: string;
            Name: string;
        };
        WebACLAssociation: {
            ResourceArn: string;
            WebACLId: string;
        };
        XssMatchSet: {
            XssMatchTuples: string;
            Name: string;
        };
    };
    WAFv2: {
        IPSet: {
            Addresses: string;
            Description: string;
            Scope: string;
            IPAddressVersion: string;
            Tags: string;
            Name: string;
        };
        LoggingConfiguration: {
            ResourceArn: string;
            LogDestinationConfigs: string;
            RedactedFields: string;
            LoggingFilter: string;
        };
        RegexPatternSet: {
            Description: string;
            RegularExpressionList: string;
            Scope: string;
            Tags: string;
            Name: string;
        };
        RuleGroup: {
            Description: string;
            Scope: string;
            Capacity: string;
            AvailableLabels: string;
            CustomResponseBodies: string;
            ConsumedLabels: string;
            Rules: string;
            VisibilityConfig: string;
            Tags: string;
            Name: string;
        };
        WebACL: {
            Description: string;
            AssociationConfig: string;
            ChallengeConfig: string;
            DataProtectionConfig: string;
            OnSourceDDoSProtectionConfig: string;
            Rules: string;
            VisibilityConfig: string;
            Name: string;
            TokenDomains: string;
            DefaultAction: string;
            Scope: string;
            CustomResponseBodies: string;
            CaptchaConfig: string;
            Tags: string;
        };
        WebACLAssociation: {
            ResourceArn: string;
            WebACLArn: string;
        };
    };
    Wisdom: {
        AIAgent: {
            Type: string;
            Description: string;
            Configuration: string;
            AssistantId: string;
            Tags: string;
            Name: string;
        };
        AIAgentVersion: {
            AssistantId: string;
            AIAgentId: string;
            ModifiedTimeSeconds: string;
        };
        AIGuardrail: {
            TopicPolicyConfig: string;
            Description: string;
            WordPolicyConfig: string;
            ContextualGroundingPolicyConfig: string;
            BlockedInputMessaging: string;
            AssistantId: string;
            BlockedOutputsMessaging: string;
            SensitiveInformationPolicyConfig: string;
            ContentPolicyConfig: string;
            Tags: string;
            Name: string;
        };
        AIGuardrailVersion: {
            AIGuardrailId: string;
            AssistantId: string;
            ModifiedTimeSeconds: string;
        };
        AIPrompt: {
            Type: string;
            Description: string;
            ApiFormat: string;
            AssistantId: string;
            TemplateConfiguration: string;
            TemplateType: string;
            ModelId: string;
            Tags: string;
            Name: string;
        };
        AIPromptVersion: {
            AssistantId: string;
            ModifiedTimeSeconds: string;
            AIPromptId: string;
        };
        Assistant: {
            Type: string;
            Description: string;
            ServerSideEncryptionConfiguration: string;
            Tags: string;
            Name: string;
        };
        AssistantAssociation: {
            Association: string;
            AssociationType: string;
            AssistantId: string;
            Tags: string;
        };
        KnowledgeBase: {
            Description: string;
            KnowledgeBaseType: string;
            SourceConfiguration: string;
            ServerSideEncryptionConfiguration: string;
            VectorIngestionConfiguration: string;
            RenderingConfiguration: string;
            Tags: string;
            Name: string;
        };
        MessageTemplate: {
            MessageTemplateAttachments: string;
            Description: string;
            Language: string;
            Content: string;
            GroupingConfiguration: string;
            KnowledgeBaseArn: string;
            ChannelSubtype: string;
            DefaultAttributes: string;
            Tags: string;
            Name: string;
        };
        MessageTemplateVersion: {
            MessageTemplateArn: string;
            MessageTemplateContentSha256: string;
        };
        QuickResponse: {
            Description: string;
            ContentType: string;
            Language: string;
            IsActive: string;
            Content: string;
            GroupingConfiguration: string;
            KnowledgeBaseArn: string;
            Channels: string;
            ShortcutKey: string;
            Tags: string;
            Name: string;
        };
    };
    WorkSpaces: {
        ConnectionAlias: {
            ConnectionString: string;
            Tags: string;
        };
        Workspace: {
            BundleId: string;
            DirectoryId: string;
            RootVolumeEncryptionEnabled: string;
            Tags: string;
            UserName: string;
            UserVolumeEncryptionEnabled: string;
            VolumeEncryptionKey: string;
            WorkspaceProperties: string;
        };
        WorkspacesPool: {
            ApplicationSettings: string;
            BundleId: string;
            Description: string;
            DirectoryId: string;
            TimeoutSettings: string;
            Capacity: string;
            PoolName: string;
            RunningMode: string;
        };
    };
    WorkSpacesThinClient: {
        Environment: {
            DesiredSoftwareSetId: string;
            KmsKeyArn: string;
            DesktopArn: string;
            DeviceCreationTags: string;
            SoftwareSetUpdateMode: string;
            SoftwareSetUpdateSchedule: string;
            MaintenanceWindow: string;
            DesktopEndpoint: string;
            Tags: string;
            Name: string;
        };
    };
    WorkSpacesWeb: {
        BrowserSettings: {
            BrowserPolicy: string;
            CustomerManagedKey: string;
            AdditionalEncryptionContext: string;
            Tags: string;
        };
        DataProtectionSettings: {
            InlineRedactionConfiguration: string;
            Description: string;
            CustomerManagedKey: string;
            AdditionalEncryptionContext: string;
            DisplayName: string;
            Tags: string;
        };
        IdentityProvider: {
            IdentityProviderDetails: string;
            PortalArn: string;
            IdentityProviderName: string;
            IdentityProviderType: string;
            Tags: string;
        };
        IpAccessSettings: {
            IpRules: string;
            Description: string;
            CustomerManagedKey: string;
            AdditionalEncryptionContext: string;
            DisplayName: string;
            Tags: string;
        };
        NetworkSettings: {
            VpcId: string;
            SecurityGroupIds: string;
            SubnetIds: string;
            Tags: string;
        };
        Portal: {
            TrustStoreArn: string;
            UserAccessLoggingSettingsArn: string;
            BrowserSettingsArn: string;
            IpAccessSettingsArn: string;
            NetworkSettingsArn: string;
            CustomerManagedKey: string;
            AdditionalEncryptionContext: string;
            DisplayName: string;
            UserSettingsArn: string;
            DataProtectionSettingsArn: string;
            InstanceType: string;
            SessionLoggerArn: string;
            MaxConcurrentSessions: string;
            Tags: string;
            AuthenticationType: string;
        };
        SessionLogger: {
            CustomerManagedKey: string;
            AdditionalEncryptionContext: string;
            DisplayName: string;
            EventFilter: string;
            LogConfiguration: string;
            Tags: string;
        };
        TrustStore: {
            CertificateList: string;
            Tags: string;
        };
        UserAccessLoggingSettings: {
            KinesisStreamArn: string;
            Tags: string;
        };
        UserSettings: {
            IdleDisconnectTimeoutInMinutes: string;
            DeepLinkAllowed: string;
            PrintAllowed: string;
            CopyAllowed: string;
            DownloadAllowed: string;
            ToolbarConfiguration: string;
            UploadAllowed: string;
            CustomerManagedKey: string;
            AdditionalEncryptionContext: string;
            DisconnectTimeoutInMinutes: string;
            CookieSynchronizationConfiguration: string;
            PasteAllowed: string;
            Tags: string;
        };
    };
    WorkspacesInstances: {
        Volume: {
            SizeInGB: string;
            SnapshotId: string;
            VolumeType: string;
            KmsKeyId: string;
            TagSpecifications: string;
            Encrypted: string;
            AvailabilityZone: string;
            Throughput: string;
            Iops: string;
        };
        VolumeAssociation: {
            VolumeId: string;
            WorkspaceInstanceId: string;
            Device: string;
            DisassociateMode: string;
        };
        WorkspaceInstance: {
            ManagedInstance: string;
            Tags: string;
        };
    };
    XRay: {
        Group: {
            GroupName: string;
            InsightsConfiguration: string;
            FilterExpression: string;
            Tags: string;
        };
        ResourcePolicy: {
            BypassPolicyLockoutCheck: string;
            PolicyName: string;
            PolicyDocument: string;
        };
        SamplingRule: {
            SamplingRule: string;
            Tags: string;
        };
        TransactionSearchConfig: {
            IndexingPercentage: string;
        };
    };
    Alexa: {
        ASKSkill: {
            AuthenticationConfiguration: string;
            VendorId: string;
            SkillPackage: string;
        };
    };
};
export default updateTypes;
//# sourceMappingURL=update-types.d.ts.map