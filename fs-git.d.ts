declare module "fs-git" {
    function open(path:string, ref?:string):Promise<FSGit>;

    class FSGit {
        public path:string;
        public ref:string;

        constructor(path:string, ref?:string);

        public filelist():Promise<IFileInfo[]>;

        public readFile(path:string):Promise<Buffer>;

        public readFile(path:string, opts:{ encoding: string; }):Promise<string>;

        public exists(path:string):Promise<boolean>;

        public _buildCommand(...args:string[]):string;
    }
    interface IFileInfo {
        permission: string;
        type: string;
        hash: string;
        path: string;
    }
}
