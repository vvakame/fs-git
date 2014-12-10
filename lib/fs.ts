/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

"use strict";

import child_process = require("child_process");

require("es6-promise").polyfill();

try {
    // optional
    require("source-map-support").install();
} catch (e) {
}

export function open(path:string, ref?:string):Promise<FSGit> {
    "use strict";

    return Promise.resolve(new FSGit(path, ref));
}

export class FSGit {
    constructor(public path:string, public ref = "master") {
    }

    filelist():Promise<IFileInfo[]> {
        return this.revParse(this.ref).then(ref=> {
            var command = this._buildCommand("ls-tree", "-r", "-z", "--full-name", this.ref);
            return new Promise((resolve:(value:IFileInfo[])=>void, reject:(error:any)=>void) => {
                child_process.exec(command, (error, stdout, stderr)=> {
                    if (error) {
                        reject(error);
                    } else {
                        var list = stdout.toString("utf8").split("\0").filter(str => str.length !== 0);
                        var resultList:IFileInfo[] = list.map(str=> {
                            var matches = str.match(/^([0-9]+)\s([^\s]+)\s([0-9a-f]+)\t(.+)$/);
                            return {
                                gitDir: this.path,
                                ref: ref,
                                permission: matches[1],
                                type: matches[2],
                                hash: matches[3],
                                path: matches[4]
                            };
                        });
                        resolve(resultList);
                    }
                });
            });
        });
    }

    readFile(path:string):Promise<Buffer>;

    readFile(path:string, opts:{encoding: string;}):Promise<string>;

    readFile(path:string, opts?:{encoding: string;}):Promise<any> {
        var command = this._buildCommand("show", this.ref + ":" + path);
        return new Promise((resolve:(value:any)=>void, reject:(error:any)=>void) => {
            child_process.exec(command, (error, stdout, stderr)=> {
                if (error) {
                    reject(error);
                } else {
                    if (opts && opts.encoding) {
                        resolve(stdout.toString(opts.encoding));
                    } else {
                        resolve(stdout);
                    }
                }
            });
        });
    }

    exists(path:string):Promise<boolean> {
        return this.filelist().then(list=> list.some(data => data.path === path));
    }

    revParse(ref:string):Promise<string> {
        var command = this._buildCommand("rev-parse", ref);

        return new Promise((resolve:(value?:any)=>void, reject:(error:any)=>void)=> {
            child_process.exec(command, (error, stdout, stderr)=> {
                if (error) {
                    console.log(command);
                    reject(error);
                } else {
                    var list = stdout.toString("utf8").split("\n").filter(str => str.length !== 0);
                    resolve(list[0]);
                }
            });
        });
    }

    _buildCommand(...args:string[]):string {
        return "git --git-dir=" + this.path + " " + args.join(" ");
    }
}

export interface IFileInfo {
    gitDir: string;
    ref: string;
    permission: string;
    type: string;
    hash: string;
    path: string;
}
