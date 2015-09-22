"use strict";

// if you use Node.js 0.10, you need exec `require("es6-promise").polyfill();`

import * as child_process from "child_process";

export function open(path: string, ref?: string): Promise<FSGit> {
    "use strict";

    return Promise.resolve(new FSGit(path, ref));
}

let maxBuffer = 1 * 1024 * 1024; // Node.js default 200*1024

export class FSGit {
    constructor(public path: string, public ref = "master") {
    }

    file(path: string): Promise<FileInfo> {
        return this._lsTree(this.ref, path)
            .then(fileList => {
                let fileInfo = fileList.filter(fileInfo => fileInfo.path === path)[0];
                if (fileInfo) {
                    return fileInfo;
                } else {
                    throw new Error(`${path} is not exists`);
                }
            });
    }

    fileList(): Promise<FileInfo[]> {
        return this._lsTree(this.ref, ".");
    }

    showRef(): Promise<RefInfo[]> {
        let command = this._buildCommand("show-ref");
        return new Promise((resolve: (value: RefInfo[]) => void, reject: (error: any) => void) => {
            child_process.exec(command, { maxBuffer: maxBuffer }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    let list = stdout.toString("utf8").split("\n").filter(line => !!line);
                    let resultList: RefInfo[] = list.map(str=> {
                        let columns = str.split(" ", 2);
                        return {
                            gitDir: this.path,
                            ref: columns[0],
                            name: columns[1]
                        };
                    });
                    resolve(resultList);
                }
            });
        });
    }

    readFile(path: string): Promise<Buffer>;

    readFile(path: string, opts: { encoding: string; }): Promise<string>;

    readFile(path: string, opts?: { encoding: string; }): Promise<any> {
        let command = this._buildCommand("show", this.ref + ":" + path);
        return new Promise((resolve: (value: any) => void, reject: (error: any) => void) => {
            child_process.exec(command, { maxBuffer: maxBuffer }, (error, stdout, stderr) => {
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

    exists(path: string): Promise<boolean> {
        return this.fileList().then(list=> list.some(data => data.path === path));
    }

    revParse(ref: string): Promise<string> {
        let command = this._buildCommand("rev-parse", ref);

        return new Promise((resolve: (value?: any) => void, reject: (error: any) => void) => {
            child_process.exec(command, { maxBuffer: maxBuffer }, (error, stdout, stderr) => {
                if (error) {
                    console.log(command);
                    reject(error);
                } else {
                    let list = stdout.toString("utf8").split("\n").filter(str => str.length !== 0);
                    resolve(list[0]);
                }
            });
        });
    }

    _lsTree(ref = this.ref, path = "."): Promise<FileInfo[]> {
        return this.revParse(ref).then(ref=> {
            let command = this._buildCommand("ls-tree", "-r", "-z", "--full-name", ref, path);
            return new Promise((resolve: (value: FileInfo[]) => void, reject: (error: any) => void) => {
                child_process.exec(command, { maxBuffer: maxBuffer }, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        let list = stdout.toString("utf8").split("\0").filter(str => str.length !== 0);
                        let resultList: FileInfo[] = list.map(str=> {
                            let matches = str.match(/^([0-9]+)\s([^\s]+)\s([0-9a-f]+)\t(.+)$/);
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

    _buildCommand(...args: string[]): string {
        return `git --git-dir=${this.path} ${args.join(" ") }`;
    }
}

export interface FileInfo {
    gitDir: string;
    ref: string;
    permission: string;
    type: string;
    hash: string;
    path: string;
}

export interface RefInfo {
    gitDir: string;
    ref: string;
    name: string;
}
