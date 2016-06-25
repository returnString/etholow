Config = config:(ConfigEntry n*)+
{
	const ret = {};
	for (const entry of config)
	{
		const configEntry = entry[0];
		ret[configEntry.id] = configEntry.name;
	}
	return ret;
}

ConfigEntry = id:rawBasicString _ ":" _ name:string { return { id, name }; }

string = '"' str:rawString '"' { return str; };
rawString = chars:[\x20-\x21\x23-\x5B\x5D-\u10FFFF]+ { return chars.join(''); }
rawBasicString = chars:[a-z_\-0-9]i+ { return chars.join(''); }
ws = [ \t]
n = "\r\n" / "\n"
_ = ws*
__ = ws+