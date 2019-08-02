#import "CheckUpdate.h"


@implementation CheckUpdate

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()

- (NSString*) packageName
{
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"];
}

- (NSString*) currentVersion
{
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
}

- (NSString*) currentBuild
{
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
}


- (NSDictionary *)constantsToExport
{
    return @{
             @"packageName": self.packageName,
             @"currentVersion": self.currentVersion,
             @"currentBuild": self.currentBuild,
             };
}

@end
