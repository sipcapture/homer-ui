"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Context = /** @class */ (function () {
    function Context() {
        this.code = '';
        this.scopes = [['vars']];
        this.bitFields = [];
        this.tmpVariableCount = 0;
        this.references = {};
    }
    Context.prototype.generateVariable = function (name) {
        var arr = [];
        var scopes = this.scopes[this.scopes.length - 1];
        arr.push.apply(arr, scopes);
        if (name) {
            arr.push(name);
        }
        return arr.join('.');
    };
    Context.prototype.generateOption = function (val) {
        switch (typeof val) {
            case 'number':
                return val.toString();
            case 'string':
                return this.generateVariable(val);
            case 'function':
                return "(" + val + ").call(" + this.generateVariable() + ", vars)";
        }
    };
    Context.prototype.generateError = function (err) {
        this.pushCode('throw new Error(' + err + ');');
    };
    Context.prototype.generateTmpVariable = function () {
        return '$tmp' + this.tmpVariableCount++;
    };
    Context.prototype.pushCode = function (code) {
        this.code += code + '\n';
    };
    Context.prototype.pushPath = function (name) {
        if (name) {
            this.scopes[this.scopes.length - 1].push(name);
        }
    };
    Context.prototype.popPath = function (name) {
        if (name) {
            this.scopes[this.scopes.length - 1].pop();
        }
    };
    Context.prototype.pushScope = function (name) {
        this.scopes.push([name]);
    };
    Context.prototype.popScope = function () {
        this.scopes.pop();
    };
    Context.prototype.addReference = function (alias) {
        if (this.references[alias])
            return;
        this.references[alias] = { resolved: false, requested: false };
    };
    Context.prototype.markResolved = function (alias) {
        this.references[alias].resolved = true;
    };
    Context.prototype.markRequested = function (aliasList) {
        var _this = this;
        aliasList.forEach(function (alias) {
            _this.references[alias].requested = true;
        });
    };
    Context.prototype.getUnresolvedReferences = function () {
        var references = this.references;
        return Object.keys(this.references).filter(function (alias) { return !references[alias].resolved && !references[alias].requested; });
    };
    return Context;
}());
exports.Context = Context;
//# sourceMappingURL=context.js.map