Cast = cast:(CastMember n*)+
{
	const ret = {};
	for (const entry of cast)
	{
		const castMember = entry[0];
		ret[castMember.id] = castMember.name;
	}
	return ret;
}

CastMember = id:rawBasicString _ ":" _ name:string { return { id, name }; }

string = '"' str:rawString '"' { return str; };
rawString = chars:[\x20-\x21\x23-\x5B\x5D-\u10FFFF]+ { return chars.join(''); }
rawBasicString = chars:[a-z_\-0-9]i+ { return chars.join(''); }
ws = [ \t]
n = "\r\n" / "\n"
_ = ws*
__ = ws+