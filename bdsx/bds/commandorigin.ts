import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { abstract } from "bdsx/common";
import { VoidPointer } from "bdsx/core";
import { mce } from "bdsx/mce";
import { NativeClass } from "bdsx/nativeclass";
import { Actor } from "./actor";
import { Dimension } from "./dimension";
import { Level, ServerLevel } from "./level";

export class CommandOrigin extends NativeClass
{
	vftable:VoidPointer;
	uuid:mce.UUID;
	level:ServerLevel;

    construct(vftable?:VoidPointer, level?:ServerLevel):void
    {
        if (vftable !== undefined && level !== undefined)
        {
            this.vftable = this.vftable;
            this.level = level;
            this.uuid = mce.UUID.generate();   
        }
        else
        {
            super.construct();
        }
    }
    
    /**
     * @deprecated use cmdorigin.destruct();
     */
    destructor():void
    {
        abstract();
    }
    getRequestId():string
    {
        abstract();
    }
    getName():string
    {
        abstract();
    }
    getBlockPosition(): BlockPos
    {
        abstract();
    }
    getWorldPosition(): Vec3
    {
        abstract();
    }
    getLevel(origin:CommandOrigin): Level
    {
        abstract();
    }
    getDimension(origin:CommandOrigin): Dimension
    {
        abstract();
    }
    getEntity(origin:CommandOrigin):Actor
    {
        abstract();
    }
};
export class PlayerCommandOrigin extends CommandOrigin
{
    // Actor*(*getEntity)(CommandOrigin* origin);
}
export class ScriptCommandOrigin extends PlayerCommandOrigin
{
    // struct VFTable
    // {
    //     void (*destructor)(ScriptCommandOrigin*);
    //     Level* (*getLevel)(ScriptCommandOrigin*);
    // };
    // VFTable* vftable;
}
