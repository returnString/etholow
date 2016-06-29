Config = config:(ConfigEntry n*)*
{
	const ret = {};
	for (const entry of config)
	{
		const configEntry = entry[0];
		ret[configEntry.id] = configEntry.value;
	}
	return ret;
}

ConfigArray = "[" _ first:ConfigValue? _ remaining:("," _ ConfigValue)* _ "]"
{
	return [ first, ...remaining.map(r => r[2]) ];
}

ConfigValue = string / ConfigArray

ConfigEntry = id:rawBasicString _ ":" _ value:ConfigValue { return { id, value }; }

string = '"' str:rawString '"' { return str; };
rawString = chars:[\x20-\x21\x23-\x5B\x5D-\u10FFFF]+ { return chars.join(''); }
rawBasicString = chars:[a-z_\-0-9]i+ { return chars.join(''); }
ws = [ \t]
n = "\r\n" / "\n"
_ = ws*
__ = ws+