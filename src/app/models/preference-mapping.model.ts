export interface PreferenceMapping {
    guid: string;
    profile: string;
    hepid: number;
    hep_alias: string;
    partid: number;
    version: number;
    retention: number;
    table_name: string;
    apply_ttl_all: boolean;
    partition_step: number;
    create_index: any;
    create_table: string;
    correlation_mapping: any;
    fields_mapping: any;
    fields_settings: any;
    schema_mapping: any;
    schema_settings: any;
}
