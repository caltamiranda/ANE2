let appInsights = require('applicationinsights');
appInsights
  .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || "InstrumentationKey=5e1cd2c1-ae65-41dc-b8f9-14664bb5887c;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=1696a2ca-1524-419d-b324-a57685eede99")
  .setAutoCollectConsole(false)
  .setAutoCollectDependencies(false)
  .setAutoCollectExceptions(false)
  .setAutoCollectHeartbeat(false)
  .setAutoCollectPerformance(false, false)
  .setAutoCollectRequests(false)
  .setAutoDependencyCorrelation(false)
  .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
  .setSendLiveMetrics(false)
  .setUseDiskRetryCaching(false);
appInsights.defaultClient.setAutoPopulateAzureProperties(false);
appInsights.start();