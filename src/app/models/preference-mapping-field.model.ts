
interface FormDefault {
    name:string
    value:any;
    color?:string
}
//fields with default options
type MappingIndex = 'none' | 'wildcard' | 'secondary';
type MappingType = 'string' | 'integer' | 'array' | 'array_string' | 'nested_integer' | 'nested_string' | 'nested_float';
type MappingFormType = 'input' | 'integer' | 'input_multi_select' | 'multiselect' | 'select'

export interface PreferenceMappingFieldModel {
    // default fields params
    id:string;
    type:MappingType;
    name:string;
    alias:string;
    form_type:MappingFormType;
    index:MappingIndex;
    skip:boolean;
    hide:boolean;
    position:number;
    // optional fields params
    virtual?:boolean;
    parent?:string;
    _form_default?:Array<FormDefault>;
    form_api?:string;
    system_param?:string;
    mapping?:string;
    sid_type?:string;
    vdata?:string;
    grid?:string;
    transform?:string;
}
