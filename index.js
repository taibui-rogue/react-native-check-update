import React, { Component } from "react";
import { AppState, NativeModules } from "react-native";
import AsyncStorage from '@react-native-community/async-storage';

const {CheckUpdate} = NativeModules;

export const PACKAGE_NAME = CheckUpdate.packageName;
export const CURRENT_VERSION = CheckUpdate.currentVersion;
export const CURRENT_BUILD = "" + CheckUpdate.currentBuild;

export const Status = {
    DEPRECATED: "DEPRECATED",
    SUPPORTED: "SUPPORTED",
    LATEST: "LATEST"
};

type Props = {
    getSupportedBuilds: () => Array<any>,
    minimumInterval?: number,
    whenAppDeprecated: (Array<string>) => void,
    whenAppSupported?: (Array<string>) => void,
    whenAppLatest?: (Array<string>) => void
};

const DEFAULT_MINIMUM_INTERVAL = 60 * 60 * 1000; // one hour
const KEY_LAST_PROMPT_TO_UPDATE = "last_prompt_to_update";

function sortBuilds(e1, e2) {
    const e1List = e1.split(".");
    const e2List = e2.split(".");
    while (e2List.length !== e1List.length) {
        (e1List.length > e2List.length ? e2List : e1List).push("0");
    }
    for (let i = 0; i < e1List.length; i++) {
        if (parseInt(e1List[i]) > parseInt(e2List[i])) {
            return 1
        } else if (parseInt(e1List[i]) < parseInt(e2List[i])) {
            return -1
        }
    }
    return 0;
}

export class UpdateChecker extends Component<Props> {

    constructor(props) {
        super(props)
    }

    componentDidMount(): void {
        AppState.addEventListener('change', this.handleAppStateChange);
        this.checkForUpdate();
    }

    componentWillUnmount(): void {
        AppState.removeEventListener('change', this.handleAppStateChange);
    }

    handleAppStateChange = (nextAppState) => {
        if (nextAppState === "active") {
            this.checkForUpdate();
        }
    };

    checkForUpdate = async () => {
        const {getSupportedBuilds} = this.props;
        try {
            const supportedBuilds = await getSupportedBuilds();
            const status = this.classifyCurrentBuild(supportedBuilds);
            this.onResult(status, supportedBuilds);
        } catch (e) {
            console.log("UpdateChecker", e.message)
        }
    };

    classifyCurrentBuild = (supportedVersions) => {
        const sortedList = supportedVersions.map(value => `${value}`)
            .sort(sortBuilds);
        const index = sortedList.indexOf(CURRENT_BUILD);
        if (index < 0) {
            return Status.DEPRECATED;
        } else if (CURRENT_BUILD === sortedList[sortedList.length - 1]) {
            return Status.LATEST;
        } else {
            return Status.SUPPORTED;
        }
    };

    onResult = (status, supportedBuilds) => {
        switch (status) {
            case Status.DEPRECATED:
                this.whenAppDeprecated(supportedBuilds);
                break;
            case Status.SUPPORTED:
                this.whenAppSupported(supportedBuilds);
                break;
            case Status.LATEST:
                this.whenAppLatest(supportedBuilds);
                break;
        }
    };

    whenAppDeprecated = (supportedBuilds) => {
        this.props.whenAppDeprecated?.(supportedBuilds);
    };

    whenAppSupported = (supportedBuilds) => {
        const {whenAppSupported, minimumInterval = DEFAULT_MINIMUM_INTERVAL} = this.props;
        AsyncStorage.getItem(KEY_LAST_PROMPT_TO_UPDATE).then(value => {
            if (!value || new Date().getTime() - parseInt(value) > minimumInterval) {
                AsyncStorage.setItem(KEY_LAST_PROMPT_TO_UPDATE, new Date().getTime().toString());
                whenAppSupported?.(supportedBuilds);
            }
        });
    };

    whenAppLatest = (supportedBuilds) => {
        this.props.whenAppLatest?.(supportedBuilds);
    };

    render() {
        return null;
    }
}