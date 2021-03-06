function exportPNG(canvas, filename) {
    saveCanvas(canvas, filename, 'png');
}

function openHelpPage() {
    window.open('help', '_blank');
}

function findClosingSquareBracketIndex(args, start) {
    let stack = [];
    stack.push(start);
    for (let index = start + 1; index < args.length; ++index) {
        if (args[index] === '[') {
            stack.push(index);
        } else if (stack.length > 0 && args[stack[stack.length - 1]] === '[' && args[index] === ']') {
            stack.pop();
        }
        if (stack.length === 0) {
            return index;
        }
    }
    return -1;
}

function findClosingRoundBracketIndex(args, start) {
    let stack = [];
    stack.push(start);
    for (let index = start + 1; index < args.length; ++index) {
        if (args[index] === '(') {
            stack.push(index);
        } else if (stack.length > 0 && args[stack[stack.length - 1]] === '(' && args[index] === ')') {
            stack.pop();
        }
        if (stack.length === 0) {
            return index;
        }
    }
    return -1;
}

function tokenizeExpression(exp) {
    let tokens = exp.split(' ');
    let commands = [];
    let index = 0;
    while (index < tokens.length) {
        let cmd, steps, angle, times, col, thickness, filename, radius, startIndex, endIndex, innerExp, lhs, rhs, op;
        switch (tokens[index].toLowerCase()) {
            case 'home':
            case 'cs':
            case 'st':
            case 'ht':
            case 'pu':
            case 'pd':
                cmd = tokens[index];
                commands.push({
                    cmd: cmd
                });
                break;
            case 'pc':
            case 'bc':
                cmd = tokens[index];
                col = tokens[index + 1];
                commands.push({
                    cmd: cmd,
                    col: col
                });
                index++;
                break;
            case 'pt':
                cmd = tokens[index];
                thickness = tokens[index + 1];
                commands.push({
                    cmd: cmd,
                    thickness: thickness
                });
                index++;
                break;
            case 'fd':
            case 'bk':
                cmd = tokens[index];
                steps = tokens[index + 1];
                commands.push({
                    cmd: cmd,
                    steps: steps
                });
                index++;
                break;
            case 'lt':
            case 'rt':
                cmd = tokens[index];
                angle = tokens[index + 1];
                commands.push({
                    cmd: cmd,
                    angle: angle
                });
                index++;
                break;
            case 'export':
                cmd = tokens[index];
                filename = tokens[index + 1];
                commands.push({
                    cmd: cmd,
                    filename: filename
                });
                index++;
                break;
            case 'repeat':
                cmd = tokens[index];
                times = tokens[index + 1];
                startIndex = index + 2;
                endIndex = findClosingSquareBracketIndex(tokens, startIndex);
                if (endIndex != -1) {
                    innerExp = tokens.slice(startIndex + 1, endIndex).join(' ');
                    commands.push({
                        cmd: cmd,
                        times: times,
                        exp: innerExp
                    });
                    index = endIndex;
                }
                break;
            case 'arc':
                cmd = tokens[index];
                angle = tokens[index + 1];
                radius = tokens[index + 2];
                commands.push({
                    cmd: cmd,
                    angle: angle,
                    radius: radius
                });
                index += 2;
                break;
            default:
                lhs = tokens[index];
                op = tokens[index + 1];
                rhs = tokens[index + 2];
                if (lhs.startsWith('$') && op === '=') {
                    commands.push({
                        cmd: 'assign',
                        name: lhs.substr(1),
                        value: rhs
                    });
                    index += 2;
                } else {
                    console.error('unknown token:', tokens[index]);
                }
        }
        index++;
    }
    return commands;
}

function evaluateExpression(exp, vars) {
    let newExp = exp;
    let varKeys = exp.match(/\$[_a-zA-Z0-9]+/g);
    if (varKeys) {
        varKeys.forEach(k => {
            let r = RegExp('\\' + k, 'g');
            let v = vars[k.substr(1)];
            if (v === undefined) {
                throw `variable '${k.substr(1)}' is not defined`;
            }
            newExp = newExp.replace(r, v);
        });
    }
    try {
        let result = math.eval(newExp);
        if (result.toString() === 'Infinity' || result.toString() === 'NaN') {
            throw { message: 'cannot divide by 0' };
        }
        return result;
    } catch (err) {
        throw err.message;
    }
}