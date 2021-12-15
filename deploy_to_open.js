async function deploy(ns, host, script, script_args) {
	if (!ns.serverExists(host)) {
		ns.tprint(`Server '${host}' does not exist. Aborting.`);
		return;
	}
	if (!ns.ls(ns.getHostname()).find(f => f === script)) {
		ns.tprint(`Script '${script}' does not exist. Aborting.`);
		return;
	}

	const threads = Math.floor((ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) / ns.getScriptRam(script));
	ns.tprint(`Launching script '${script}' on server '${host}' with ${threads} threads and the following arguments: ${script_args}`);
	await ns.scp(script, ns.getHostname(), host);
	if (threads > 0){
		ns.exec(script, host, threads, ...script_args);
	}
}


function scan(ns, parent, server, list) {
	const children = ns.scan(server);
	for (let child of children) {
		if (parent == child) {
			continue;
		}
		list.push(child);

		scan(ns, server, child, list);
	}
}

export function list_servers(ns) {
	const list = [];
	scan(ns, '', 'home', list);
	return list;
}


/** @param {NS} ns **/
export async function main(ns) {
	const args = ns.flags([["help", false]]);
	if (args.help || args._.length < 2) {
		ns.tprint("This script deploys another script on a all open servers with maximum threads possible.");
		ns.tprint(`Usage: run ${ns.getScriptName()} SCRIPT ARGUMENTS`);
		ns.tprint("Example:");
		ns.tprint(`> run ${ns.getScriptName()} basic_hack.js foodnstuff`);
		return;
	}

	const script = args._[0];
	const script_args = args._.slice(1);

	const servers = list_servers(ns).filter(s => ns.hasRootAccess(s));
	for (const server of servers) {
		ns.killall(server);
		await deploy(ns, server, script, script_args);
	}

}