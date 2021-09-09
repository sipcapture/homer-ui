import { TranslateCompiler } from '@ngx-translate/core';

export class TranslateLinkCompiler extends TranslateCompiler {

    /*
    * Needed by ngx-translate
    */
    public compile(value: string, lang: string): string {
        return value;
    }

    /*
    * Triggered once from TranslateCompiler
    * Initiates recurive this.parseReferencePointers()
    * Returns modified translations object for ngx-translate to process
    */
    public compileTranslations(translations: any, lang: string) {
        this.parseReferencePointers(translations, translations);
        return translations;
    }

    /*
     * Triggered once from this.compileTranslations()
     * Recursively loops through an object,
     * replacing any property value that has a string starting with "@LINK." with the LINK global string definition.
     * i.e. @LINK.LOCATION.OVERVIEW becomes Location Overview
     */
    private parseReferencePointers(currentTranslations, masterLanguageFile) {
        Object.keys(currentTranslations).forEach((key) => {
            if (currentTranslations[key] !== null && typeof currentTranslations[key] === 'object') {
                this.parseReferencePointers(currentTranslations[key], masterLanguageFile);
                return;
            }
            if (typeof currentTranslations[key] === 'string') {
                if (currentTranslations[key].includes("@LINK.")) {
                    currentTranslations[key] = this.parseReference(currentTranslations[key], masterLanguageFile);
                }
            }
        });
    }
    private parseReference(translation, masterLanguageFile) {
        const regex = /([^@]*)(@LINK\.[a-zA-Z\_\.\-\s\(\)]+@)(.*)/
        const referenceLink = translation.match(regex);
        if (referenceLink === null) {
            return translation
        }
        const link = referenceLink[2].replaceAll('@', '').replace('.toLowerCase', '').replace('.toUpperCase', '').replace('()', '')
        let replacementPart = this.getDescendantPropertyValue(masterLanguageFile, link)
        if (referenceLink[2].includes('.toLowerCase()') && typeof replacementPart !== 'undefined' && replacementPart !== null) {
            replacementPart = replacementPart.toLowerCase();
        } else if (referenceLink[2].includes('.toUpperCase()') && typeof replacementPart !== 'undefined' && replacementPart !== null) {
            replacementPart = replacementPart.toUpperCase();
        }
        if (typeof replacementPart === 'undefined' || replacementPart.toString() === '[object Object]') {
            replacementPart = '';
        }
        let replacementProperty = translation.replace(referenceLink[2], replacementPart);
        if (!replacementProperty.includes('@LINK.')) {
            return replacementProperty;
        } else {
            return this.parseReference(replacementProperty, masterLanguageFile);
        }
    }
    /*
     * Takes a string representation of an objects dot notation
     * i.e. "LINK.LABEL.LOCATION"
     * and returns the property value of the input objects property
     */
    private getDescendantPropertyValue(obj, desc) {
        var arr = desc.split(".");
        while(arr.length && (obj = obj[arr.shift()]));
        return obj;
    }

}