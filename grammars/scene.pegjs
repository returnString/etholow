{
	function createNode(type, props)
	{
		return {
			type,
			data: props,
			debug: {
				location: location(),
				raw: text(),
			},
		};
	}
}

File = list:(Block n*)+
{
	return list.map(e => e[0]);
}

Block = "#" _ id:rawBasicString _ n entries:BlockEntry* end:BlockEnd
{
	return createNode('block', {
		id,
		entries: entries.concat([ end ]),
	});
}

BlockEntry = BlockEntryN
BlockEntryN = entry:(Line) n? { return entry; }

BlockEnd = ChoiceList / BlockEndN
BlockEndN = entry:(Goto) n? { return entry; }

LinePrefix = name:rawBasicString _ ":" { return { name } }
Line = prefix:LinePrefix? _ line:string
{
	return createNode('line', {
		name: prefix ? prefix.name : null,
		line,
	});
}

ChoiceList = list:(Choice n)+
{
	return createNode('choiceList', {
		choices: list.map(e => e[0]),
	});
}

Choice = ">" _ desc:string _ target:Goto
{
	return createNode('choice', {
		desc,
		target,
	});
}

Goto = "=>" _ target:(GotoScene/GotoBlock)
{
	return target;
}

GotoBlock = blockID:rawBasicString
{
	return createNode('gotoBlock', {
		blockID,
	});
}

GotoScene = "scene." sceneID:rawBasicString
{
	return createNode('gotoScene', {
		sceneID,
	});
}

string = '"' str:rawString '"' { return str; };
rawString = chars:[\x20-\x21\x23-\x5B\x5D-\u10FFFF]+ { return chars.join(''); }
rawBasicString = chars:[a-z_\-0-9]i+ { return chars.join(''); }
ws = [ \t]
n = "\r\n" / "\n"
_ = ws*
__ = ws+