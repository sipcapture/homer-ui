import { VERSION } from '../../VERSION';
import { Functions } from '@app/helpers/functions';

const PREFIX = `HOMER-`;
export const ConstValue = {
    SEARCH_QUERY_LOKI: `searchQueryLoki`,
    LOKI_PREFIX: `2000_loki`,
    serverLoki: `serverLoki`,
    CONTAINER: `targetResultsContainer`,
    SELECT_PROTO: `proto_selector`,
    LIMIT: `limit`,
    /** LOCAL STORAGE CONSTs */
    SEARCH_QUERY: `${PREFIX}searchQuery`,
    SQWR: `${PREFIX}searchQueryWidgetsResult`,
    RESULT_STATE: `${PREFIX}result-state`,
    RESULT_SORT_STATE: `${PREFIX}result-sort-state`,
    USER_SETTINGS: `${PREFIX}user-settings`,
    CURRENT_USER: `${PREFIX}currentUser`,
    USER_FAVORITES: `${PREFIX}favorites`,
    SEARCH_TABS: `${PREFIX}search-tabs`,
    RESULT_CHART_SETTING: `${PREFIX}resultsChartSetting`,
    RESULT_GRID_SETTING: `${PREFIX}resultsGridSetting`,
    LOCAL_FILTER_STATE: `${PREFIX}localFilterState`
};
export class UserConstValue {
    static get USER_PREFIX() {
        return `${PREFIX}${Functions.JSON_parse(localStorage.getItem(ConstValue.CURRENT_USER))?.user?.username}-`;
    }
    static get SEARCH_QUERY_LOKI() {
        return `${this.USER_PREFIX}searchQueryLoki`;
    }
    static get SEARCH_QUERY() {
        return `${this.USER_PREFIX}searchQuery`;
    }
    static get SQWR() {
        return `${this.USER_PREFIX}searchQueryWidgetsResult`;
    }
    static get RESULT_STATE() {
        return `${this.USER_PREFIX}result-state`;
    }
    static  get RESULT_SORT_STATE() {
        return `${this.USER_PREFIX}result-sort-state`;
    }
    static get USER_SETTINGS() {
        return `${this.USER_PREFIX}user-settings`;
    }
    static get CURRENT_USER() {
        return `${this.USER_PREFIX}currentUser`;
    }
    static get USER_FAVORITES() {
        return `${this.USER_PREFIX}favorites`;
    }
    static get SEARCH_TABS() {
        return `${this.USER_PREFIX}search-tabs`;
    }
    static get RESULT_CHART_SETTING()  {
        return `${this.USER_PREFIX}resultsChartSetting`;
    }
    static get RESULT_GRID_SETTING() {
        return `${this.USER_PREFIX}resultsGridSetting`;
    }
    static get LOCAL_FILTER_STATE() {
        return `${this.USER_PREFIX}localFilterState`;
    }
    static get GRAPH_SETTINGS() {
        return `${this.USER_PREFIX}graphSettings`;
    }
}
