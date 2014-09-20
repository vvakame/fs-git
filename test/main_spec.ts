/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />

import assert = require("power-assert");
import fsgit = require("../lib/fs");

describe("fs-git", ()=> {
    it("open master branch", ()=> {
        return fsgit.open("./test/fixture/bare", "master").then(fs => {
            var filelist = fs.filelist().then(files=> {
                assert(files.length !== 0);
                assert(files.filter(file=> file.path === ".zshrc").length === 1);
            });
            var readFile = fs.readFile(".zshrc", {encoding: "utf8"}).then(content=> {
                assert(typeof content === "string");
            });
            var exists1 = fs.exists(".zshrc").then(exists=> {
                assert(exists === true);
            });
            var exists2 = fs.exists("notExists").then(exists=> {
                assert(exists === false);
            });
            return Promise.all([filelist, readFile, exists1, exists2]);
        });
    });

    it("open specific ref", ()=> {
        return fsgit.open("./test/fixture/bare", "ae6a41").then(fs => {
            var filelist = fs.filelist().then(files=> {
                assert(files.length !== 0);
                assert(files.filter(file=> file.path === ".zshrc").length === 1);
            });
            var readFile = fs.readFile(".zshrc", {encoding: "utf8"}).then(content=> {
                assert(typeof content === "string");
            });
            var exists1 = fs.exists(".zshrc").then(exists=> {
                assert(exists === true);
            });
            var exists2 = fs.exists("notExists").then(exists=> {
                assert(exists === false);
            });
            return Promise.all([filelist, readFile, exists1, exists2]);
        });
    });
});
