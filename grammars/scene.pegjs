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

File = list:(NamedBlock n*)+
{
	return list.map(e => e[0]);
}

BlockEntries = entries:BlockEntry* end:BlockEnd
{
	return entries.concat([ end ]);
}

AnonBlock = _ n? _ "[" _ n? _ entries:BlockEntries _ n? _ "]"
{
	return createNode('block', {
		entries,
	});
}

NamedBlock = "#" _ id:rawBasicString _ n entries:BlockEntries
{
	return createNode('block', {
		id,
		entries,
	});
}

BlockEntry = _ ret:BlockEntryN { return ret; }
BlockEntryN = entry:(Line / StateBlock) _ n? { return entry; }

BlockEnd = _ ret:(ChoiceList / BlockEndN) { return ret; }
BlockEndN = entry:(Goto) _ n? { return entry; }

LinePrefix = name:rawBasicString _ ":" { return { name } }
Line = prefix:LinePrefix? _ line:string
{
	return createNode('line', {
		name: prefix ? prefix.name : null,
		line,
	});
}

ChoiceList = list:(Choice _ n?)+
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

ChoicePrefix = ">>" / ">"
Choice = prefix:ChoicePrefix _ desc:string _ target:Goto _ cond:ChoiceConditional? n?
{
	return createNode('choice', {
		prefix,
		desc,
		target,
		cond,
	});
}

Goto = "=>" _ target:(GotoScene/GotoBlock/AnonBlock)
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

// keep this up to date when adding operators with lower precedence
StateBinaryLowest = StateBinaryLogical

StateBinaryLogical = first:StateBinaryEq _ rest:(("&&" / "||") _ StateBinaryEq)+
{
	return createNode('stateBinaryOp', binaryOpData(first, rest));
} / StateBinaryEq

StateBinaryEq = first:StateBinaryAdd _ rest:(("==") _ StateBinaryAdd)+
{
	return createNode('stateBinaryOp', binaryOpData(first, rest));
} / StateBinaryAdd

StateBinaryAdd = first:StateBinaryMul _ rest:(("+" / "-") _ StateBinaryMul)+
{
	return createNode('stateBinaryOp', binaryOpData(first, rest));
} / StateBinaryMul

StateBinaryMul = first:StateUnaryOp _ rest:(("*" / "/") _ StateUnaryOp)+
{
	return createNode('stateBinaryOp', binaryOpData(first, rest));
} / StateUnaryOp

StateUnaryOp = op:"!" _ arg:StateBinaryPrimary
{
	return createNode('stateUnaryOp', {
		op,
		arg,
	});
} / StateBinaryPrimary

StateBinaryPrimary = StateLiteral
	/ StateProperty
	/ "(" _ expr:StateBinaryLowest _ ")" { return expr; }

StateAssignment = prop:StateProperty _ "=" _ rhs:StateExpression
{
	return createNode('stateAssignment', {
		prop,
		rhs,
	});
}

StateExpression = StateAssignment / StateBinaryLowest / StateLiteral / StateProperty
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