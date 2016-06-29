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

	function binaryOpData(first, rest)
	{
		return rest.reduce((memo, curr) => { return { op: curr[0], lhs: memo, rhs: curr[2] }; }, first)
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
BlockEntryN = entry:(Line / StateBlock) n? { return entry; }

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

ChoiceList = list:(Choice n?)+
{
	return createNode('choiceList', {
		choices: list.map(e => e[0]),
	});
}

ChoiceConditional = "?" _ expr:StateExpression
{
	return createNode('choiceConditional', {
		expr,
	});
}

Choice = ">" _ desc:string _ target:Goto _ cond:ChoiceConditional?
{
	return createNode('choice', {
		desc,
		target,
		cond,
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

StateProperty = first:rawBasicString remaining:("." rawBasicString)+
{
	return createNode('stateProperty', {
		identChain: [ first, ...remaining.map(r => r[1]) ],
	});
}

StateLiteral = value:(string / bool / integer)
{
	return createNode('stateLiteral', {
		value,
	});
}

StateBinaryAdd = first:StateBinaryMul _ rest:(("+" / "-") _ StateBinaryMul)+
{
	return createNode('stateBinaryOp', binaryOpData(first, rest));
} / StateBinaryMul

StateBinaryMul = first:StateBinaryEq _ rest:(("*" / "/") _ StateBinaryEq)+
{
	return createNode('stateBinaryOp', binaryOpData(first, rest));
} / StateBinaryEq

StateBinaryEq = first:StateBinaryPrimary _ rest:(("==") _ StateBinaryPrimary)+
{
	return createNode('stateBinaryOp', binaryOpData(first, rest));
} / StateBinaryPrimary

StateBinaryPrimary = StateLiteral
	/ StateProperty
	/ "(" _ expr:StateBinaryAdd _ ")" { return expr; }

StateAssignment = prop:StateProperty _ "=" _ rhs:StateExpression
{
	return createNode('stateAssignment', {
		prop,
		rhs,
	});
}

StateExpression = StateAssignment / StateBinaryAdd / StateLiteral / StateProperty
StateBlock = "{" _ n? _ exprs:(_ StateExpression n?)* _ "}"
{
	return createNode('stateBlock', {
		exprs: exprs.map(e => e[1]),
	});
}

integer = value:[0-9]+ { return parseInt(value.join(''), 10); }
boolTrue = "true" { return true; }
boolFalse = "false" { return false; }
bool = boolTrue / boolFalse
string = '"' str:rawString '"' { return str; };
rawString = chars:[\x20-\x21\x23-\x5B\x5D-\u10FFFF]+ { return chars.join(''); }
rawBasicString = chars:[a-z_\-0-9]i+ { return chars.join(''); }
ws = [ \t]
n = "\r\n" / "\n"
_ = ws*
__ = ws+