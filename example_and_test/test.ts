
import { netevent, PacketId, NetworkIdentifier, command, serverControl, Actor, chat, bin, NativePointer, CANCEL, serverInstance, StaticPointer, VoidPointer, MinecraftPacketIds } from "bdsx";
import { capi } from "bdsx/capi";
import { HashSet } from "bdsx/hashset";
import { bin64_t } from "bdsx/nativetype";
import { PseudoRandom } from "bdsx/pseudorandom";
import { dll } from "bdsx/dll";
import { bedrockServer } from "bdsx/launcher";
import { Tester } from "bdsx/tester";
import { ActorType } from "bdsx/bds/actor";
import { networkHandler } from "bdsx/bds/networkidentifier";
import { proc2 } from "bdsx/bds/proc";

let nextTickPassed = false;
let commandTestPassed = false;
let commandNetPassed = false;
let chatCancelCounter = 0;
Tester.test({
    async globals() {
        this.assert(!!serverInstance && serverInstance.isNotNull(), 'serverInstance not found');
        this.assert((serverInstance as VoidPointer as StaticPointer).getPointer(0).equals(proc2["??_7ServerInstance@@6BAppPlatformListener@@@"]), 
            'serverInstance is not ServerInstance');
        this.assert(!!networkHandler && networkHandler.isNotNull(), 'networkHandler not found');
        this.assert((networkHandler as VoidPointer as StaticPointer).getPointer(0).equals(proc2["??_7NetworkHandler@@6BIGameConnectionInfoProvider@Social@@@"]),
            'networkHandler is not NetworkHandler');
        const inst = networkHandler.instance;
        this.assert(!!inst && inst.isNotNull(), 'RaknetInstance not found');
        this.assert((inst as VoidPointer as StaticPointer).getPointer(0).equals(proc2["??_7RakNetInstance@@6BConnector@@@"]), 
            'networkHandler.instance is not RaknetInstance');

        const rakpeer = inst.peer;
        this.assert(!!rakpeer && rakpeer.isNotNull(), 'RakNet::RakPeer not found');
        this.assert((rakpeer as VoidPointer as StaticPointer).getPointer(0).equals(proc2["??_7RakPeer@RakNet@@6BRakPeerInterface@1@@"]), 
            'networkHandler.instance.peer is not RakNet::RakPeer');
    },
    async nexttick() {
        nextTickPassed = await Promise.race([
            new Promise<boolean>(resolve=>process.nextTick(()=>resolve(true))),
            new Promise<boolean>(resolve=>setTimeout(()=>{ 
                if (nextTickPassed) return;
                this.fail();
                resolve(false);
            }, 1000))
        ]);
    },

    async command(){
        let passed = false;
        command.hook.on((cmd, origin)=>{
            if (cmd === '/__dummy_command')
            {
                passed = origin === 'Server';
            }
            else if (cmd === '/test')
            {
                if (origin === 'Server') return;
                if (!commandTestPassed)
                {
                    if (!commandNetPassed) this.error('command.net does not emitted');
                    commandTestPassed = true;
                    this.log('/test passed');
                    return 0;
                }
            }
        });
        command.net.on((ev)=>{
            if (ev.command === '/test')
            {
                commandNetPassed = true;
            }
        });
        await new Promise<void>((resolve)=>{
            bedrockServer.commandOutput.on(output=>{
                if (output.startsWith('Unknown command: __dummy_command'))
                {
                    if (passed) resolve();
                    else this.error('command.hook.listener failed');
                    return CANCEL;
                }
            });
            bedrockServer.executeCommandOnConsole('__dummy_command');
        })
    },

    chat(){
        chat.on(ev=>{
            if (ev.message == "TEST YEY!")
            {
                if (!commandTestPassed && !commandNetPassed)
                {
                    console.error('Please /test first');
                    return CANCEL;
                }
                const MAX_CHAT = 5;
                chatCancelCounter ++;
                this.log(`test (${chatCancelCounter}/${MAX_CHAT})`);
                this.assert(connectedNi === ev.networkIdentifier, 'the network identifier does not matched');
                if (chatCancelCounter === MAX_CHAT)
                {
                    this.log('> tested and stopping...');
                    setTimeout(()=>serverControl.stop(), 1000);
                }
                return CANCEL;
            }
        });
    },

    actor(){

        const system = server.registerSystem(0, 0);
        system.listenForEvent('minecraft:entity_created', ev => {
            try
            {
                const uniqueId = ev.data.entity.__unique_id__;
                const actor2 = Actor.fromUniqueId(uniqueId["64bit_low"], uniqueId["64bit_high"]);
                const actor = Actor.fromEntity(ev.data.entity);
                this.assert(actor === actor2, 'Actor.fromEntity is not matched');
            
                if (actor !== null)
                {
                    const actualId = actor.getUniqueIdLow()+':'+actor.getUniqueIdHigh();
                    const expectedId = uniqueId["64bit_low"]+':'+uniqueId["64bit_high"];
                    this.assert(actualId === expectedId, 
                        `Actor uniqueId is not matched (actual=${actualId}, expected=${expectedId})`);
                    
                    if (ev.__identifier__ === 'minecraft:player')
                    {
                        const name = system.getComponent(ev.data.entity, 'minecraft:nameable')!.data.name;
                        this.assert(name === connectedId, 'id does not matched');
                        this.assert(actor.getTypeId() === ActorType.Player, 'player type does not matched');
                        this.assert(actor.isPlayer(), 'a player is not the player');
                        this.assert(connectedNi === actor.getNetworkIdentifier(), 'the network identifier does not matched');
                    }
                    else
                    {
                        this.assert(!actor.isPlayer(), `a not player is the player(identifier:${ev.__identifier__})`);
                    }
                }
            }
            catch (err)
            {
                this.error(err.stack);
            }
        });
    },

    bin(){
        this.assert(bin.make64(1, 0) === bin64_t.one, '[test] bin.make64(1, 0) failed');
        this.assert(bin.make64(0, 0) === bin64_t.zero, '[test] bin.make64(0, 0) failed');
        this.assert(bin.make64(-1, -1) === bin64_t.minus_one, '[test] bin.make64(-1, -1) failed');
        const small = bin.make64(0x100, 0);
        this.assert(small === '\u0100\0\0\0', '[test] bin.make64(0x100, 0) failed');
        const big = bin.make64(0x10002, 0);
        this.assert(big === '\u0002\u0001\0\0', '[test] bin.make64(0x10002, 0) failed');
        this.assert(bin.sub(big, small) === '\uff02\0\0\0', '[test] bin.sub() failed');
        const big2 = bin.add(big, bin.add(big, small));
        this.assert(big2 === '\u0104\u0002\0\0', '[test] bin.add() failed');
        const bigbig = bin.add(bin.add(bin.muln(big2, 0x100000000), small), bin64_t.one);
        this.assert(bigbig === '\u0101\u0000\u0104\u0002', '[test] bin.muln() failed');
        const dived = bin.divn(bigbig, 2);
        this.assert(dived[0] === '\u0080\u0000\u0082\u0001', '[test] bin.divn() failed');
        this.assert(dived[1] === 1, '[test] bin.divn() failed');
        this.assert(bin.toString(dived[0],16) === '1008200000080', '[test] bin.toString() failed');
        
        const ptr = capi.malloc(10);
        try
        {
            const bignum = bin.makeVar(123456789012345);
            new NativePointer(ptr).writeVarBin(bignum);
            this.assert(new NativePointer(ptr).readVarBin() === bignum, '[test] writevarbin / readvarbin failed');
        }
        finally
        {
            capi.free(ptr);
        }
    },

    hashset(){
        class HashItem
        {
            constructor(public readonly value:number)
            {
            }
        
            hash():number
            {
                return this.value;
            }
        
            equals(other:HashItem):boolean
            {
                return this.value === other.value;
            }
        }

        const TEST_COUNT = 200;

        const values:number[] = [];
        const n = new PseudoRandom(12345);
        const hashset = new HashSet<HashItem>();
        let count = 0;
        for (const v of hashset.entires())
        {
            count ++;
        }
        if (count !== 0) this.error(`empty hashset is not empty`);
        for (let i=0;i<TEST_COUNT;)
        {
            const v = n.rand() % 100;
            values.push(v);
            hashset.add(new HashItem(v));
            
            i++;
        }
        
        for (const v of values)
        {
            if (!hashset.has(new HashItem(v)))
            {
                this.error(`hashset.has failed, item not found ${v}`);
                continue;
            }
            if (!hashset.delete(new HashItem(v)))
            {
                this.error(`hashset.delete failed ${v}`);
                continue;
            }
        }
        if (hashset.size !== 0)
        {
            this.error(`cleared hashset is not cleared: ${hashset.size}`);
        }
        for (let i=0;i<200;i++)
        {
            const v = n.rand() % 100;
            if (hashset.has(new HashItem(v)))
            {
                this.error('hashset.has failed, found on empty');
            }
        }      
        
    },

    memset():void
    {
        const dest = new Uint8Array(12);
        const ptr = new NativePointer;
        ptr.setAddressFromBuffer(dest);
        dll.vcruntime140.memset(ptr, 1, 12);
        for (const v of dest)
        {
            this.assert(v === 1, 'wrong value: '+v);
        }
    },

    nethook(){
        let idcheck = 0;
        let sendpacket = 0;
        for (let i=0;i<255;i++)
        {
            netevent.raw(i).on((ptr, size, ni, packetId)=>{
                idcheck = packetId;
                this.assert(packetId === ptr.readUint8(), `different packetId in buffer. id=${packetId}`);
            });
            netevent.before<MinecraftPacketIds>(i).on((ptr, ni, packetId)=>{
                this.assert(packetId === idcheck, `different packetId on before. id=${packetId}`);
                this.assert(ptr.getId() === idcheck, `different class.packetId on before. id=${packetId}`);
            });
            netevent.after(<MinecraftPacketIds>i).on((ptr, ni, packetId)=>{
                this.assert(packetId === idcheck, `different packetId on after. id=${packetId}`);
                this.assert(ptr.getId() === idcheck, `different class.packetId on after. id=${packetId}`);
            });
            netevent.send<MinecraftPacketIds>(i).on((ptr, ni, packetId)=>{
                this.assert(ptr.getId() === packetId, `different class.packetId on send. id=${packetId}`);
                sendpacket++;
            });
        }
    
        const conns = new Set<NetworkIdentifier>();
        netevent.after(PacketId.Login).on((ptr, ni)=>{
            this.assert(!conns.has(ni), '[test] logined without connected');
            conns.add(ni);
            setTimeout(()=>{
                if (sendpacket === 0)
                {
                    this.error('[test] no send packet');
                }
            }, 1000);
        });
        NetworkIdentifier.close.on(ni=>{
            this.assert(conns.delete(ni), '[test] disconnected without connected');
        });
    },
});

let connectedNi:NetworkIdentifier;
let connectedId:string;

netevent.raw(PacketId.Login).on((ptr, size, ni)=>{
    connectedNi = ni;
});
netevent.after(PacketId.Login).on(ptr=>{
    connectedId = ptr.connreq.cert.getId();
});


