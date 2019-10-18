
declare global
{
    namespace chakraX
    {
        const fs:{
        };

        /**
         * Native console object
         */
        const console:{
            /**
             * print message to console
             */
            log(message:string):void;
            /**
             * set text color
             * @param color color bit flags, You can composite like console.FOREGROUND_BLUE | console.FOREGROUND_RED
             */
            setTextAttribute(color:number):void;
            /**
             * get text color
             */
            getTextAttribute():number;
            readonly FOREGROUND_BLUE:number;
            readonly FOREGROUND_GREEN:number;
            readonly FOREGROUND_RED:number;
            readonly FOREGROUND_INTENSITY:number;
            readonly BACKGROUND_BLUE:number;
            readonly BACKGROUND_GREEN:number;
            readonly BACKGROUND_RED:number;
            readonly BACKGROUND_INTENSITY:number;
        };

        /**
         * It must be called on system.update
         * It process I/O completion from File Writing/Reading
         */
        function update():void;

        /**
         * Native file, It will open file with CreateFile WinAPI function
         * Must be closed
         */
        class NativeFile
        {
            /**
             * @param path file path
             * @param access bit flags, NativeFile.WRITE or NativeFile.READ
             * @param creation NativeFile.CREATE_NEW or NativeFile.CREATE_ALWAYS or NativeFile.OPEN_EXISTING or NativFile.OPEN_ALWAYS
             */
            constructor(path:string, access:number, creation:number);
            /**
             * Read as buffer
             * @param offset position from begin of file
             * @param size reading size
             * @param callback callback, error is zero if succeeded
             * @param buffer true = result is buffer, false = result is string
             */
            read(offset:number, size:number, callback:(error:number, buffer:Uint8Array)=>void, buffer:true):void;
            /**
             * Read as string
             * @param offset position from begin of file
             * @param size reading size
             * @param callback callback, error is zero if succeeded
             * @param buffer true = result is buffer, false = result is string
             */
            read(offset:number, size:number, callback:(error:number, buffer:Uint8Array)=>void, buffer:true):void;
            /**
             * Write file
             * @param offset position from begin of file
             * @param buffer buffer for writing
             * @param callback callback, error is zero if succeeded
             */
            write(offset:number, buffer:string|ArrayBuffer|ArrayBufferView|DataView, callback:(error:number, bytes:number)=>void):void;
            close():void;

            static readonly WRITE:number;
            static readonly READ:number;
            static readonly CREATE_NEW:number;
            static readonly CREATE_ALWAYS:number;
            static readonly OPEN_EXISTING:number;
            static readonly OPEN_ALWAYS:number;
        }
    }
}

export = chakraX;