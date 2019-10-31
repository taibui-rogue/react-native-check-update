import { useEffect } from "react";
import { AppState, NativeModules } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";

const { CheckUpdate } = NativeModules;

export const PACKAGE_NAME = CheckUpdate.packageName;
export const CURRENT_VERSION = CheckUpdate.currentVersion;
export const CURRENT_BUILD = "" + CheckUpdate.currentBuild;

export const Status = {
  DEPRECATED: "DEPRECATED",
  SUPPORTED: "SUPPORTED",
  LATEST: "LATEST"
};

const KEY_LAST_PROMPT_TO_UPDATE = "last_prompt_to_update";

const sortBuilds = (e1, e2) => {
  const e1List = e1.split(".");
  const e2List = e2.split(".");
  while (e2List.length !== e1List.length) {
    (e1List.length > e2List.length ? e2List : e1List).push("0");
  }
  for (let i = 0; i < e1List.length; i++) {
    if (parseInt(e1List[i]) > parseInt(e2List[i])) {
      return 1;
    } else if (parseInt(e1List[i]) < parseInt(e2List[i])) {
      return -1;
    }
  }
  return 0;
};

const classifyCurrentBuild = (supportedBuilds, betaBuilds) => {
  if (
    Array.isArray(betaBuilds) &&
    betaBuilds.map(value => `${value}`).includes(CURRENT_BUILD)
  ) {
    return Status.LATEST;
  }
  const sortedList = supportedBuilds.map(value => `${value}`).sort(sortBuilds);
  const index = sortedList.indexOf(CURRENT_BUILD);
  if (index < 0) {
    return Status.DEPRECATED;
  } else if (index === sortedList.length - 1) {
    return Status.LATEST;
  } else {
    return Status.SUPPORTED;
  }
};

export const UpdateChecker = props => {
  const {
    getSupportedBuilds,
    whenAppDeprecated,
    whenAppSupported,
    whenAppLatest,
    minimumInterval
  } = props;
  useEffect(() => {
    onResult = status => {
      switch (status) {
        case Status.DEPRECATED:
          whenAppDeprecated?.();
          break;
        case Status.SUPPORTED:
          AsyncStorage.getItem(KEY_LAST_PROMPT_TO_UPDATE).then(value => {
            if (!value || Date.now() - parseInt(value) > minimumInterval) {
              AsyncStorage.setItem(
                KEY_LAST_PROMPT_TO_UPDATE,
                Date.now().toString()
              );
              whenAppSupported?.();
            }
          });
          break;
        case Status.LATEST:
          whenAppLatest?.();
          break;
      }
    };
    const checkForUpdate = async () => {
      try {
        const {
          supportedBuilds = [],
          betaBuilds = []
        } = await getSupportedBuilds();
        const status = classifyCurrentBuild(supportedBuilds, betaBuilds);
        onResult(status);
      } catch (e) {
        console.log("UpdateChecker", e.message);
      }
    };
    const handleAppStateChange = nextAppState => {
      if (nextAppState === "active") checkForUpdate();
    };
    AppState.addEventListener("change", handleAppStateChange);
    return () => AppState.removeEventListener("change", handleAppStateChange);
  }, [
    getSupportedBuilds,
    minimumInterval,
    whenAppDeprecated,
    whenAppLatest,
    whenAppSupported
  ]);
  return null;
};

UpdateChecker.defaultProps = {
  getSupportedBuilds: () => [],
  minimumInterval: 60 * 60 * 1000 // one hour
};
