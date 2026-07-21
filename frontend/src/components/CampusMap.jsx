import { useState, useEffect, useRef } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import nodesData from '../../../campus-data/nodes.json'

const VIEW = { CAMPUS: 'campus', BUILDING: 'building' }

const W = 900
const H = 600

const BUILDINGS = {
    'Social Commons': {
        colour: '#8B0000',
        lightColour: '#fee2e2',
        outline: [
        [498, 345], [575, 363], [586, 332], [623, 343],
        [631, 300], [555, 273], [544, 303], [509, 297]
        ],
        centre: { x: 564, y: 320 },
        floors: [2, 1, 0],
        label: 'Social Commons',
    },
    'Enterprise Commons': {
        colour: '#1B5E20',
        lightColour: '#dcfce7',
        outline: [
        [542, 417], [607, 439], [616, 406], [636, 411],
        [649, 367], [608, 356], [595, 388], [558, 378],
        [552, 390]
        ],
        centre: { x: 597, y: 398 },
        floors: [2, 1, 0],
        label: 'Enterprise Commons',
    },
    'Learning Commons': {
        colour: '#003087',
        lightColour: '#dbeafe',
        outline: [
        [431, 351], [422, 391], [461, 403], [458, 426],
        [451, 445], [510, 464], [520, 422], [500, 413],
        [505, 396], [510, 382], [511, 370], [497, 365],
        [477, 361]
        ],
        centre: { x: 475, y: 403 },
        floors: [2, 1, 0],
        label: 'Learning Commons',
    },
}

const ROADS = [
    { x1: 184, y1: 219, x2: 207, y2: 238, width: 12, color: '#cbd5e1' },
    { x1: 207, y1: 238, x2: 280, y2: 215, width: 12, color: '#cbd5e1' },
    { x1: 280, y1: 215, x2: 405, y2: 202, width: 10, color: '#cbd5e1' },
    { x1: 405, y1: 202, x2: 546, y2: 282, width: 10, color: '#cbd5e1' },
    { x1: 207, y1: 238, x2: 212, y2: 269, width: 8, color: '#cbd5e1' },
    { x1: 237, y1: 276, x2: 212, y2: 269, width: 8, color: '#cbd5e1' },
    { x1: 254, y1: 248, x2: 237, y2: 276, width: 8, color: '#cbd5e1' },
    { x1: 285, y1: 237, x2: 254, y2: 248, width: 8, color: '#cbd5e1' },
    { x1: 368, y1: 263, x2: 285, y2: 237, width: 8, color: '#cbd5e1' },
    { x1: 429, y1: 279, x2: 368, y2: 263, width: 8, color: '#cbd5e1' },
    { x1: 427, y1: 302, x2: 429, y2: 279, width: 8, color: '#cbd5e1' },
    { x1: 427, y1: 302, x2: 444, y2: 319, width: 8, color: '#cbd5e1' },
    { x1: 444, y1: 319, x2: 487, y2: 346, width: 8, color: '#cbd5e1' },
    { x1: 444, y1: 319, x2: 406, y2: 323, width: 8, color: '#cbd5e1' },
    { x1: 406, y1: 323, x2: 453, y2: 348, width: 8, color: '#cbd5e1' },
    { x1: 453, y1: 348, x2: 419, y2: 350, width: 8, color: '#cbd5e1' },
    { x1: 419, y1: 350, x2: 406, y2: 394, width: 8, color: '#cbd5e1' },
    { x1: 406, y1: 394, x2: 443, y2: 412, width: 8, color: '#cbd5e1' },
    { x1: 443, y1: 412, x2: 439, y2: 452, width: 8, color: '#cbd5e1' },
    { x1: 439, y1: 452, x2: 521, y2: 470, width: 8, color: '#cbd5e1' },
    { x1: 521, y1: 470, x2: 535, y2: 429, width: 8, color: '#cbd5e1' },
    { x1: 535, y1: 429, x2: 519, y2: 411, width: 8, color: '#cbd5e1' },
    { x1: 519, y1: 411, x2: 536, y2: 370, width: 8, color: '#cbd5e1' },
    { x1: 536, y1: 370, x2: 487, y2: 346, width: 8, color: '#cbd5e1' },
    { x1: 536, y1: 370, x2: 586, y2: 377, width: 8, color: '#cbd5e1' },
    { x1: 586, y1: 377, x2: 597, y2: 354, width: 8, color: '#cbd5e1' },
    { x1: 535, y1: 429, x2: 602, y2: 447, width: 8, color: '#cbd5e1' },
]

const GREEN_AREAS = [
    { x: 141, y: 295, w: 255, h: 214, rx: 12 },
    { x: 647, y: 303, w: 164, h: 201, rx: 12 },
    { x: 395, y: 467, w: 255, h: 41, rx: 12 },
    { x: 647, y: 144, w: 166, h: 158, rx: 12 },
    { x: 393, y: 409, w: 36, h: 60, rx: 12 },
    { x: 538, y: 449, w: 106, h: 17, rx: 12 },
]

const NODE_TRANSFORM = {
    // Empty: all three floors now use native canvas coordinates, no
    // per-floor scaling needed. Kept as a lookup (with the identity
    // fallback already in getFloorNodes()) in case Enterprise or
    // Learning Commons ever need one during their own tracing.
}

const FLOOR_WALLS = {
    'Social Commons-2': [
        { points: [[272,682], [272,782], [527,783]], smooth: false },
        { points: [[527,785], [530,793], [534,800], [541,805], [548,808], [556,809], [565,808], [572,805], [578,799], [583,792], [585,785], [586,776], [584,768], [579,761], [573,756], [566,752], [558,750]], smooth: false },
        { points: [[555,753], [556,650]], smooth: false },
        { points: [[555,653], [586,648], [583,596]], smooth: true },
        { points: [[583,597], [556,597], [555,496], [583,496]], smooth: false },
        { points: [[583,495], [590,443], [527,443]], smooth: true },
        { points: [[526,444], [401,444], [400,343]], smooth: false },
        { points: [[400,343], [428,335], [429,286]], smooth: true },
        { points: [[429,287], [428,183]], smooth: false },
        { points: [[428,183], [433,130], [366,127]], smooth: true },
        { points: [[363,127], [272,130]], smooth: false },
        { points: [[272,129], [230,127], [214,157]], smooth: true },
        { points: [[214,158], [119,160]], smooth: false },
        { points: [[117,163], [116,156], [113,149], [108,143], [101,139], [94,137], [86,137], [79,139], [73,144], [68,150], [65,157], [65,164], [66,172], [70,178], [75,184], [82,187], [89,189]], smooth: false },
        { points: [[89,189], [92,445]], smooth: false },
        { points: [[92,445], [69,448], [67,485]], smooth: true },
        { points: [[69,618], [70,643], [97,649]], smooth: true },
        { points: [[220,469], [221,464], [223,459], [226,455], [229,451], [234,448], [239,446], [243,444], [248,444], [254,445], [259,446], [263,449], [267,452], [270,456], [273,461], [274,466], [275,471]], smooth: false },
        { points: [[373,626], [373,620], [374,615], [376,610], [380,605], [384,601], [389,598], [394,597], [400,596], [405,597], [411,598], [415,601], [420,605], [423,610], [425,615], [426,620], [426,626]], smooth: false },
        { points: [[217,318], [217,312], [218,307], [220,302], [223,297], [228,294], [232,291], [237,289], [243,288], [249,288], [254,290], [259,292], [263,296], [267,300], [269,305], [271,309], [272,318]], smooth: false },
        { points: [[398,444], [393,445], [388,446], [383,449], [379,453], [376,457], [373,462], [372,467], [372,472], [372,477], [374,482], [377,487], [380,491], [385,494], [390,496], [395,498], [400,498]], smooth: false },
        { points: [[67,487], [67,618]], smooth: true },
        { points: [[97,650], [97,804], [247,807], [246,470]], smooth: false },
        { points: [[246,444], [249,392], [321,392], [321,536]], smooth: false },
        { points: [[69,471], [220,470]], smooth: false },
        { points: [[67,524], [94,524], [95,546], [220,546], [221,626], [95,625], [94,546]], smooth: false },
        { points: [[221,544], [220,470]], smooth: false },
        { points: [[158,470], [158,527]], smooth: false },
        { points: [[160,804], [160,566]], smooth: false },
        { points: [[97,716], [160,716]], smooth: false },
        { points: [[319,575], [319,631], [221,629]], smooth: false },
        { points: [[247,557], [346,558], [346,537]], smooth: false },
        { points: [[346,558], [347,581]], smooth: false },
        { points: [[120,471], [98,462], [92,441]], smooth: true },
        { points: [[208,805], [208,753], [247,754]], smooth: false },
        { points: [[247,780], [272,780]], smooth: false },
        { points: [[89,343], [101,322], [119,316], [218,317]], smooth: true },
        { points: [[247,469], [338,469]], smooth: false },
        { points: [[373,626], [390,629], [400,651], [409,628], [425,626]], smooth: true },
        { points: [[426,444], [426,471]], smooth: false },
        { points: [[526,442], [526,469]], smooth: false },
        { points: [[245,288], [245,130]], smooth: false },
        { points: [[272,315], [373,315]], smooth: false },
        { points: [[370,315], [372,311]], smooth: false },
        { points: [[372,318], [379,287], [429,286]], smooth: true },
        { points: [[89,275], [94,313], [130,316]], smooth: true },
        { points: [[243,343], [267,342], [274,317]], smooth: true },
        { points: [[271,681], [555,682]], smooth: false },
        { points: [[337,681], [337,783]], smooth: false },
        { points: [[401,682], [400,782]], smooth: false },
        { points: [[450,683], [450,779]], smooth: false },
        { points: [[499,680], [498,780]], smooth: false },
    ],
    'Social Commons-1': [
        { points: [[223,54], [76,56], [78,654]], smooth: false },
        { points: [[223,56], [225,49], [228,42], [234,36], [240,33], [248,31], [255,31], [262,33], [269,38], [274,44], [277,51], [278,58], [277,66], [274,73], [269,78], [262,83], [255,85]], smooth: false },
        { points: [[373,353], [375,348], [377,344], [381,339], [385,336], [390,334], [395,332], [400,331], [405,331], [410,332], [415,334], [420,337], [423,341], [427,345], [429,350], [430,355], [431,360]], smooth: false },
        { points: [[549,624], [554,625], [559,627], [564,630], [568,633], [571,638], [573,643], [575,648], [575,653], [575,658], [573,663], [570,668], [567,672], [563,676], [558,679], [553,680], [548,681]], smooth: false },
        { points: [[252,82], [252,180]], smooth: false },
        { points: [[280,235], [252,235], [252,328], [278,330], [278,353], [369,355]], smooth: false },
        { points: [[431,356], [518,355]], smooth: false },
        { points: [[75,179], [124,176], [130,214]], smooth: true },
        { points: [[223,208]], smooth: true },
        { points: [[223,208], [224,202], [225,197], [228,192], [231,187], [236,184], [241,181], [246,180], [252,179], [258,180], [263,182], [268,184], [272,188], [276,193], [278,198], [280,203], [280,209]], smooth: false },
        { points: [[278,233], [278,212]], smooth: false },
        { points: [[132,211], [220,209]], smooth: false },
        { points: [[401,384], [403,627]], smooth: false },
        { points: [[378,652], [379,645], [383,638], [388,633], [394,630], [401,628], [408,628], [415,631], [421,635], [425,641], [428,648], [428,655], [427,662], [423,668], [418,673], [411,677], [404,678]], smooth: false },
        { points: [[406,983], [552,983]], smooth: false },
        { points: [[255,804], [521,804]], smooth: false },
        { points: [[403,681], [403,706]], smooth: false },
        { points: [[548,678], [548,773]], smooth: false },
        { points: [[577,926], [578,839]], smooth: false },
        { points: [[545,623], [549,531], [574,530]], smooth: false },
        { points: [[551,474], [549,384], [556,363], [578,359]], smooth: false },
        { points: [[574,530], [574,506]], smooth: true },
        { points: [[521,504], [520,498], [521,492], [523,486], [526,481], [531,477], [536,474], [541,472], [547,472], [553,473], [559,475], [564,479], [568,483], [571,488], [572,494], [572,500], [571,506]], smooth: false },
        { points: [[520,353], [532,329], [577,328]], smooth: true },
        { points: [[76,309], [105,312], [105,546], [174,546], [174,355], [104,356]], smooth: false },
        { points: [[104,454], [201,458]], smooth: false },
        { points: [[201,434], [202,481]], smooth: false },
        { points: [[578,328], [578,358]], smooth: false },
        { points: [[375,958], [379,974], [406,983]], smooth: true },
        { points: [[546,773], [578,778], [578,839]], smooth: true },
        { points: [[552,982], [578,978], [578,923]], smooth: true },
        { points: [[543,622], [539,624], [535,627], [532,630], [529,633], [527,637], [525,642], [524,646], [524,651], [524,655], [525,660], [527,664], [529,668], [532,671], [535,674], [539,677], [543,679]], smooth: false },
        { points: [[252,327], [246,328], [241,330], [236,333], [232,337], [229,342], [226,347], [225,353], [225,359], [226,364], [229,370], [232,374], [236,378], [241,381], [247,383], [252,384], [258,384]], smooth: false },
        { points: [[228,505], [229,500], [230,496], [233,491], [236,487], [240,484], [244,482], [249,481], [254,480], [258,480], [263,482], [268,484], [272,487], [275,490], [277,495], [279,499], [280,504]], smooth: false },
        { points: [[429,651], [524,647]], smooth: true },
        { points: [[372,802], [394,797], [401,773]], smooth: true },
        { points: [[401,773], [404,797], [429,803]], smooth: true },
        { points: [[520,805], [527,786], [548,772]], smooth: true },
        { points: [[230,508], [249,516], [252,530]], smooth: true },
        { points: [[520,506], [529,522], [549,533]], smooth: true },
        { points: [[521,351], [523,376], [549,384]], smooth: true },
        { points: [[252,529], [259,514], [278,504]], smooth: true },
        { points: [[256,660], [252,954], [375,956]], smooth: false },
        { points: [[353,653], [78,653]], smooth: false },
    ],
    'Social Commons-0': [
        { points: [[315,910], [315,337], [98,334], [98,151], [129,121], [167,150], [283,151]], smooth: false },
        { points: [[283,151], [284,145], [286,139], [289,134], [294,129], [299,125], [304,122], [310,121], [317,120], [323,121], [329,123], [334,126], [339,130], [343,134], [346,140], [348,146], [349,152]], smooth: false },
        { points: [[466,151], [467,145], [469,139], [472,133], [477,128], [482,125], [487,122], [494,120], [500,120], [506,121], [512,123], [518,127], [522,131], [526,137], [529,142], [530,149], [530,155]], smooth: false },
        { points: [[493,303], [500,303], [507,304], [514,306], [520,310], [525,315], [529,321], [531,327], [532,334], [532,341], [530,348], [526,354], [522,360], [516,364], [510,367], [503,369], [496,369]], smooth: false },
        { points: [[499,850], [509,851], [517,855], [525,861], [530,869], [534,878], [534,887], [532,897], [527,905], [520,912], [512,916], [502,918], [493,917], [484,914], [476,908], [470,900], [467,891]], smooth: false },
        { points: [[350,153], [466,153]], smooth: false },
        { points: [[532,155], [507,157], [498,186]], smooth: true },
        { points: [[493,483], [534,483], [533,553]], smooth: true },
        { points: [[499,731], [532,728], [532,667]], smooth: true },
        { points: [[493,482], [488,484], [482,487], [478,491], [474,496], [471,501], [470,507], [469,513], [469,518], [470,524], [472,530], [476,535], [480,539], [484,543], [489,546], [495,547], [501,548]], smooth: false },
        { points: [[501,662], [501,554], [530,552]], smooth: false },
        { points: [[498,662], [532,665]], smooth: false },
        { points: [[498,183], [492,302]], smooth: false },
        { points: [[496,369], [492,482]], smooth: false },
        { points: [[349,888], [466,888]], smooth: false },
        { points: [[312,910], [337,911], [349,888]], smooth: true },
        { points: [[97,234], [315,234], [313,338]], smooth: false },
        { points: [[234,202], [234,335]], smooth: false },
        { points: [[98,180], [133,182]], smooth: false },
        { points: [[204,204], [262,204]], smooth: false },
        { points: [[313,513], [469,513]], smooth: false },
        { points: [[160,233], [158,335]], smooth: false },
        { points: [[95,298], [158,298]], smooth: false },
        { points: [[466,332], [469,357], [499,369]], smooth: true },
        { points: [[499,851], [499,731]], smooth: false },
        { points: [[313,696], [467,695]], smooth: false },
        { points: [[467,695], [473,717], [498,731]], smooth: true },
    ],
}

const FLOOR_DOORS = {
    'Social Commons-2': [
        {x1:164, y1:806, x2:190, y2:805},
        {x1:209, y1:806, x2:243, y2:806},
        {x1:247, y1:781, x2:271, y2:781},
        {x1:318, y1:783, x2:337, y2:783},
        {x1:382, y1:783, x2:400, y2:783},
        {x1:432, y1:783, x2:452, y2:783},
        {x1:470, y1:783, x2:488, y2:783},
        {x1:507, y1:783, x2:527, y2:783},
        {x1:353, y1:316, x2:373, y2:316},
        {x1:272, y1:316, x2:293, y2:316},
        {x1:199, y1:317, x2:215, y2:316},
        {x1:123, y1:317, x2:139, y2:316},
        {x1:242, y1:445, x2:227, y2:451},
        {x1:160, y1:779, x2:160, y2:798},
        {x1:94, y1:564, x2:94, y2:548},
        {x1:86, y1:523, x2:70, y2:524},
        {x1:319, y1:576, x2:318, y2:557},
        {x1:319, y1:554, x2:319, y2:537},
        {x1:246, y1:654, x2:246, y2:683},
        {x1:246, y1:628, x2:220, y2:628},
        {x1:161, y1:627, x2:161, y2:648},
    ],
    'Social Commons-1': [
        {x1:376, y1:804, x2:356, y2:804},
        {x1:447, y1:802, x2:431, y2:804},
        {x1:521, y1:802, x2:505, y2:804},
        {x1:540, y1:776, x2:529, y2:787},
        {x1:297, y1:803, x2:278, y2:802},
        {x1:208, y1:208, x2:225, y2:208},
        {x1:130, y1:210, x2:146, y2:210},
        {x1:231, y1:217, x2:247, y2:233},
        {x1:253, y1:326, x2:252, y2:308},
        {x1:253, y1:255, x2:253, y2:235},
        {x1:346, y1:354, x2:313, y2:354},
        {x1:174, y1:451, x2:174, y2:438},
        {x1:173, y1:480, x2:174, y2:458},
        {x1:81, y1:547, x2:103, y2:547},
    ],
    'Social Commons-0': [
        {x1:372, y1:697, x2:346, y2:697},
        {x1:461, y1:695, x2:439, y2:696},
        {x1:501, y1:664, x2:467, y2:692},
        {x1:471, y1:525, x2:483, y2:544},
        {x1:372, y1:512, x2:349, y2:512},
        {x1:467, y1:512, x2:442, y2:513},
        {x1:491, y1:472, x2:492, y2:446},
        {x1:493, y1:441, x2:495, y2:406},
        {x1:495, y1:402, x2:496, y2:369},
        {x1:492, y1:307, x2:467, y2:332},
        {x1:493, y1:296, x2:493, y2:266},
        {x1:495, y1:262, x2:495, y2:225},
        {x1:495, y1:221, x2:496, y2:191},
        {x1:466, y1:154, x2:499, y2:186},
        {x1:445, y1:151, x2:422, y2:152},
        {x1:225, y1:236, x2:201, y2:236},
        {x1:261, y1:233, x2:239, y2:232},
        {x1:157, y1:233, x2:135, y2:232},
        {x1:502, y1:661, x2:501, y2:641},
        {x1:501, y1:576, x2:502, y2:557},
    ],
}

const FLOOR_STAIRS = {
    'Social Commons-2': [
        {x:530, y:496, w:28, h:128},
    ],
    'Social Commons-1': [
        {x:397, y:707, w:136, h:24},
        {x:378, y:378, w:20, h:126},
        {x:403, y:382, w:22, h:122},
    ],
    'Social Commons-0': [
        {x:318, y:578, w:155, h:31},
        {x:315, y:179, w:29, h:167},
    ],
}

function wallPathD(points, smooth) {
    let d = `M ${points[0][0]} ${points[0][1]}`
    if (!smooth || points.length < 3) {
        for (let i = 1; i < points.length; i++) d += ` L ${points[i][0]} ${points[i][1]}`
        return d
    }
    for (let i = 1; i < points.length - 1; i++) {
        const mx = (points[i][0] + points[i + 1][0]) / 2
        const my = (points[i][1] + points[i + 1][1]) / 2
        d += ` Q ${points[i][0]} ${points[i][1]}, ${mx} ${my}`
    }
    const last = points[points.length - 1]
    d += ` L ${last[0]} ${last[1]}`
    return d
}

function doorPaths(d) {
    const dx = d.x2 - d.x1, dy = d.y2 - d.y1
    const doorW = Math.hypot(dx, dy) || 1
    const px = -dy / doorW, py = dx / doorW
    const leafX = d.x1 + px * doorW, leafY = d.y1 + py * doorW
    return {
        gap: `M ${d.x1} ${d.y1} L ${d.x2} ${d.y2}`,
        leaf: `M ${d.x1} ${d.y1} L ${leafX} ${leafY}`,
        arc: `M ${leafX} ${leafY} A ${doorW} ${doorW} 0 0 0 ${d.x2} ${d.y2}`,
    }
}

const NON_BOOKABLE = new Set([
    'SC-F0-WR', 'SC-F0-PR', 'SC-F0-EL', 'SC-F0-ER',
    'SC-F0-PD-1', 'SC-F0-PD-2', 'SC-F0-PD-3', 'SC-F0-PD-4',
    'SC-F2-PD-1', 'SC-F2-EL', 'SC-F2-WR',
    'EC-F0-WR', 'EC-F1-WR', 'EC-F2-WR',
    'LC-F0-WR', 'LC-F1-WR', 'LC-F2-WR',
    'SC-F1-WR', 'SC-F1-EL', 'SC-F1-PD-1', 'SC-F1-PD-2', 'SC-F1-PD-3', 'SC-F1-MR',
])

const ROOM_DATA = [
    // ── SOCIAL COMMONS ── Floor 0
    { code: 'SC-F0-EG', x: 315, y: 699, w: 185, h: 190, label: 'Egypt', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-FC', x: 314, y: 153, w: 180, h: 360, label: 'Food Court', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-WR', x: 159, y: 234, w: 156, h: 101, label: 'Washrooms', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PR', x: 98, y: 235, w: 59, h: 65, label: 'Prayer Room', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-1', x: 473, y: 664, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-2', x: 468, y: 487, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-3', x: 468, y: 304, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-4', x: 467, y: 121, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-EL', x: 103, y: 119, w: 60, h: 60, label: 'Elevator', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-EG', x: 470, y: 853, w: 61, h: 59, label: 'Electrical Room', building: 'Social Commons', floor: 0 },
    // ── SOCIAL COMMONS ── Floor 1
    { code: 'SC-F1-ET', x: 84, y: 61, w: 171, h: 153, label: 'Ethiopia', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-WR', x: 109, y: 351, w: 71, h: 200, label: 'Washrooms', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-MO', x: 260, y: 810, w: 140, h: 150, label: 'Morocco', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-AL', x: 400, y: 810, w: 170, h: 170, label: 'Algeria', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-FC', x: 210, y: 380, w: 165, h: 220, label: 'Food Court', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-1', x: 228, y: 185, w: 54, h: 58, label: 'POD', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-2', x: 380, y: 631, w: 50, h: 50, label: 'POD', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-3', x: 529, y: 781, w: 50, h: 50, label: 'POD', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-EL', x: 230, y: 332, w: 50, h: 50, label: 'Elevator', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-MR', x: 76, y: 316, w: 27, h: 233, label: 'Mechanical Room', building: 'Social Commons', floor: 1 },
    // ── SOCIAL COMMONS ── Floor 2
    { code: 'SC-F2-DJ', x: 95, y: 162, w: 150, h: 155, label: 'Djibouti', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-SS', x: 246, y: 131, w: 185, h: 185, label: 'South Sudan', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-BT', x: 375, y: 290, w: 55, h: 50, label: 'Bibi Titi', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-PD-1', x: 223, y: 296, w: 45, h: 45, label: 'POD', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-VD', x: 270, y: 683, w: 285, h: 100, label: 'Vendors', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-FC', x: 320, y: 463, w: 210, h: 170, label: 'Food Court', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-EL', x: 380, y: 447, w: 50, h: 50, label: 'Elevator', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-WR', x: 240, y: 463, w: 79, h: 170, label: 'Washrooms', building: 'Social Commons', floor: 2 },
    // ── ENTERPRISE COMMONS ── Floor 0
    { code: 'EC-F0-LE', x: 25, y: 50, w: 120, h: 60, label: 'Lesotho', building: 'Enterprise Commons', floor: 0 },
    { code: 'EC-F0-FL', x: 155, y: 50, w: 100, h: 60, label: 'Fab Lab', building: 'Enterprise Commons', floor: 0 },
    { code: 'EC-F0-WR', x: 265, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Enterprise Commons', floor: 0 },
    // ── ENTERPRISE COMMONS ── Floor 1
    { code: 'EC-F1-AN', x: 25, y: 50, w: 100, h: 60, label: 'Angola', building: 'Enterprise Commons', floor: 1 },
    { code: 'EC-F1-NA', x: 135, y: 50, w: 100, h: 60, label: 'Namibia', building: 'Enterprise Commons', floor: 1 },
    { code: 'EC-F1-UG', x: 245, y: 50, w: 100, h: 60, label: 'Uganda', building: 'Enterprise Commons', floor: 1 },
    { code: 'EC-F1-WR', x: 355, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Enterprise Commons', floor: 1 },
    // ── ENTERPRISE COMMONS ── Floor 2
    { code: 'EC-F2-FG', x: 25, y: 50, w: 120, h: 60, label: 'Fab Lab Gallery', building: 'Enterprise Commons', floor: 2 },
    { code: 'EC-F2-BU', x: 155, y: 50, w: 100, h: 60, label: 'Burundi', building: 'Enterprise Commons', floor: 2 },
    { code: 'EC-F2-KE', x: 265, y: 50, w: 100, h: 60, label: 'Kenya', building: 'Enterprise Commons', floor: 2 },
    { code: 'EC-F2-WR', x: 375, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Enterprise Commons', floor: 2 },
    // ── LEARNING COMMONS ── Floor 0
    { code: 'LC-F0-LC', x: 25, y: 50, w: 130, h: 60, label: 'Leadership Center', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-WC', x: 165, y: 50, w: 100, h: 60, label: 'Wellness Center', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-BE', x: 275, y: 50, w: 100, h: 60, label: 'Benin', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-SH', x: 25, y: 120, w: 100, h: 60, label: 'Sahel', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-ES', x: 135, y: 120, w: 100, h: 60, label: 'Eswatini', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-WR', x: 245, y: 120, w: 50, h: 60, label: 'Washrooms', building: 'Learning Commons', floor: 0 },
    // ── LEARNING COMMONS ── Floor 1
    { code: 'LC-F1-RC', x: 25, y: 50, w: 120, h: 60, label: 'Resource Center', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-GN', x: 155, y: 50, w: 100, h: 60, label: 'Guinea', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-WR', x: 345, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-GM', x: 25, y: 120, w: 100, h: 60, label: 'Gambia', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-LB', x: 135, y: 120, w: 100, h: 60, label: 'Liberia', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-MZ', x: 245, y: 120, w: 100, h: 60, label: 'Mozambique', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-MW', x: 355, y: 120, w: 100, h: 60, label: 'Malawi', building: 'Learning Commons', floor: 1 },
    // ── LEARNING COMMONS ── Floor 2
    { code: 'LC-F2-RE', x: 25, y: 50, w: 80, h: 60, label: 'Reception', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-AD', x: 115, y: 50, w: 80, h: 60, label: 'Administration', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-SW', x: 205, y: 50, w: 100, h: 60, label: 'Staff Work Hive', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-CO', x: 25, y: 120, w: 100, h: 60, label: 'Congo', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-GA', x: 135, y: 120, w: 100, h: 60, label: 'Gabon', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-WR', x: 245, y: 120, w: 50, h: 60, label: 'Washrooms', building: 'Learning Commons', floor: 2 },
]

function CampusMap({
    rooms = [],
    highlightedRoom = null,
    navigationPath = [],
    currentNodeId = null,
    settingPosition = false,
    onRoomClick,
    onNodeClick,
    onMapClick,
}) {
    const [view, setView] = useState(VIEW.CAMPUS)
    const [activeBuilding, setActiveBuilding] = useState(null)
    const [activeFloor, setActiveFloor] = useState(2)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const floorSvgRef = useRef(null)

    const { position, currentBuilding } = useGeolocation()

    useEffect(() => {
        if (currentBuilding && view === VIEW.CAMPUS) {
        enterBuilding(currentBuilding.building, currentBuilding.floor)
        }
    }, [currentBuilding])

    useEffect(() => {
        if (
        currentBuilding &&
        view === VIEW.BUILDING &&
        activeBuilding === currentBuilding.building
        ) {
        setActiveFloor(currentBuilding.floor)
        }
    }, [currentBuilding])

    useEffect(() => {
        if (!currentNodeId || !navigationPath.length || view !== VIEW.BUILDING) return
        const stepNode = navigationPath.find(p => p.id === currentNodeId)
        if (stepNode && stepNode.floor !== activeFloor) {
            setActiveFloor(stepNode.floor)
        }
    }, [currentNodeId, navigationPath])
    
    const enterBuilding = (buildingName, floor = 2) => {
        setActiveBuilding(buildingName)
        setActiveFloor(floor)
        setView(VIEW.BUILDING)
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    const exitBuilding = () => {
        setView(VIEW.CAMPUS)
        setActiveBuilding(null)
        setZoom(1)
        setPan({x: 0, y: 0})
    }

    const getAvailability = (code) => {
        const room = rooms.find(r => r.code === code)
        if (!room) return null
        return room.is_available
    }

    const getFloorNodes = (buildingName, floorNum) => {
        const key = `${buildingName}-${floorNum}`
        const t = NODE_TRANSFORM[key] || { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
        return nodesData
        .filter(n => n.building === buildingName && n.floor === floorNum)
        .map(n => ({
            ...n,
            x: Math.round(n.x * t.scaleX + t.offsetX),
            y: Math.round(n.y * t.scaleY + t.offsetY),
        }))
    }

    const handleWheel = (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(z => Math.min(Math.max(z * delta, 0.5), 5))
    }

    const handleMouseDown = (e) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }

    const handleMouseMove = (e) => {
        if (!isDragging) return
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }

    const handleMouseUp = () => setIsDragging(false)

    const gpsToPixel = (lat, lng) => {
        const LAT_TOP    = -1.9288
        const LAT_BOTTOM = -1.9318
        const LNG_LEFT   = 30.1508
        const LNG_RIGHT  = 30.1548
        return {
        x: ((lng - LNG_LEFT)   / (LNG_RIGHT  - LNG_LEFT))   * W,
        y: ((lat - LAT_TOP)    / (LAT_BOTTOM - LAT_TOP))    * H,
        }
    }

    // Converts a click event into exact SVG viewBox coordinates (820x1000),
    // correctly accounting for the SVG's responsive scaling. Rooms call
    // e.stopPropagation() so this only fires for clicks on walls, floor
    // space, or anything else without its own click handler -- exactly
    // the "click anywhere, navigate to the nearest node" behaviour.
    const handleFloorClick = (e) => {
        if (settingPosition || !onMapClick || !floorSvgRef.current) return
        const svg = floorSvgRef.current
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
        onMapClick(Math.round(svgP.x), Math.round(svgP.y), activeBuilding, activeFloor)
    }

    const renderCampusView = () => (
        <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
            width: '100%', height: 'auto',
            cursor: isDragging ? 'grabbing' : 'grab',
            borderRadius: '12px',
            background: '#f1f5f9',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Satellite overlay removed now that outlines are anchored on real
                GPS coordinates. To spot-check alignment, temporarily add back:
                <image href="/campus-satellite.png" x={0} y={0} width={W} height={H}
                       opacity={0.4} preserveAspectRatio="xMidYMid meet" /> */}

            <defs>
                <pattern id="groundHatch" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="14" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <pattern id="treeTexture" patternUnits="userSpaceOnUse" width="16" height="16">
                    <circle cx="4" cy="4" r="1.4" fill="none" stroke="#86efac" strokeWidth="0.8" />
                    <circle cx="12" cy="10" r="1.4" fill="none" stroke="#86efac" strokeWidth="0.8" />
                    <circle cx="8" cy="14" r="1" fill="none" stroke="#86efac" strokeWidth="0.7" />
                </pattern>
            </defs>
            <rect x={0} y={0} width={W} height={H} fill="url(#groundHatch)" />

            {/* Green areas — trees and grass */}
            {GREEN_AREAS.map((g, i) => (
            <g key={i}>
                <rect
                    x={g.x} y={g.y} width={g.w} height={g.h} rx={g.rx}
                    fill="#bbf7d0" opacity={0.6}
                />
                <rect
                    x={g.x} y={g.y} width={g.w} height={g.h} rx={g.rx}
                    fill="url(#treeTexture)"
                />
            </g>
            ))}

            {ROADS.map((r, i) => (
            <line
                key={i}
                x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                stroke={r.color} strokeWidth={r.width}
                strokeLinecap="round"
            />
            ))}

            <circle cx={284} cy={233} r={8} fill="#f59e0b"/>
            <text x={284} y={218} textAnchor="middle" fontSize={11} fill="#92400e" fontWeight="600">
            Main Entrance
            </text>

            <text x={325} y={218} textAnchor="middle" fontSize={10} fill="#64748b">
            Parking
            </text>

            {Object.entries(BUILDINGS).map(([name, bld]) => (
            <g
                key={name}
                onClick={() => enterBuilding(name)}
                style={{ cursor: 'pointer' }}
            >
                <polygon
                points={bld.outline.map(([x, y]) => `${x},${y}`).join(' ')}
                fill={bld.lightColour}
                stroke={bld.colour}
                strokeWidth={2.5}
                strokeLinejoin="round"
                />

                <text
                x={bld.centre.x}
                y={bld.centre.y - 8}
                textAnchor="middle"
                fontSize={12}
                fontWeight="700"
                fill={bld.colour}
                >
                {bld.label.split(' ')[0]}
                </text>
                <text
                x={bld.centre.x}
                y={bld.centre.y + 8}
                textAnchor="middle"
                fontSize={11}
                fill={bld.colour}
                >
                {bld.label.split(' ').slice(1).join(' ')}
                </text>

                <text
                x={bld.centre.x}
                y={bld.centre.y + 24}
                textAnchor="middle"
                fontSize={9}
                fill={bld.colour}
                opacity={0.6}
                >
                tap to enter
                </text>
            </g>
            ))}

            {position && (() => {
            const { x, y } = gpsToPixel(position.lat, position.lng)
            return (
                <g>
                <circle cx={x} cy={y} r={18} fill="#1d4ed8" opacity={0.12}/>
                <circle cx={x} cy={y} r={9}  fill="#1d4ed8"/>
                <circle cx={x} cy={y} r={4}  fill="white"/>
                </g>
            )
            })()}

        </g>

        <g transform={`translate(${W - 44}, 34)`}>
            <circle r={22} fill="white" opacity={0.9} stroke="#cbd5e1" strokeWidth={1.5} />
            <path d="M 0,-14 L 5,4 L 0,-1 L -5,4 Z" fill="#475569" />
            <text y={19} textAnchor="middle" fontSize={9} fontWeight="700" fill="#475569">N</text>
        </g>
        </svg>
    )

    const renderBuildingView = () => {
        const bldData = BUILDINGS[activeBuilding]
        if (!bldData) return null
        const colour = bldData.colour
        const floorRooms = ROOM_DATA.filter(
        r => r.building === activeBuilding && r.floor === activeFloor
        )
        const floorNodes = getFloorNodes(activeBuilding, activeFloor)

        return (
        <div>
            <div style={{
            background: colour, color: 'white',
            padding: '10px 16px', borderRadius: '10px 10px 0 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                onClick={exitBuilding}
                style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    color: 'white', borderRadius: '6px',
                    padding: '4px 10px', cursor: 'pointer', fontSize: '13px'
                }}
                >
                ← Campus
                </button>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>
                {activeBuilding}
                </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
                {bldData.floors.map(f => (
                <button
                    key={f}
                    onClick={() => setActiveFloor(f)}
                    style={{
                    width: '32px', height: '32px', borderRadius: '6px',
                    border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '13px',
                    background: activeFloor === f ? 'white' : 'rgba(255,255,255,0.2)',
                    color: activeFloor === f ? colour : 'white'
                    }}
                >
                    {f}
                </button>
                ))}
            </div>
            </div>

            <svg
            ref={floorSvgRef}
            onClick={handleFloorClick}
            viewBox="0 0 820 1000"
            style={{
                width: '100%', height: 'auto',
                background: '#f8fafc',
                borderLeft: `1px solid ${colour}`,
                borderRight: `1px solid ${colour}`,
                cursor: onMapClick ? 'crosshair' : 'default',
                display: 'block',
            }}
            >
            <text x={12} y={20} fontSize={12} fontWeight="600" fill={colour}>
                {activeFloor === 0 ? 'Ground Floor' : `Floor ${activeFloor}`}
            </text>

            <defs>
                <pattern id="stairHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.5" />
                </pattern>
                <filter id="roomShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
                </filter>
                <pattern id="blueprintGrid" patternUnits="userSpaceOnUse" width="20" height="20">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
            </defs>
            <rect x={0} y={0} width={820} height={1000} fill="url(#blueprintGrid)" />

            {floorRooms.map(room => {
                const isNonBookable = NON_BOOKABLE.has(room.code)
                const isAvailable = isNonBookable ? null : getAvailability(room.code)
                const isHighlighted = highlightedRoom === room.code
                const fillColour = isNonBookable
                ? '#e2e8f0'
                : (isAvailable === null ? '#e2e8f0' : (isAvailable ? '#dcfce7' : '#fee2e2'))
                const strokeColour = isNonBookable
                ? '#94a3b8'
                : (isHighlighted ? '#1d4ed8' : (isAvailable ? '#16a34a' : '#dc2626'))

                return (
                <g
                    key={room.code}
                    onClick={(e) => { e.stopPropagation(); onRoomClick && onRoomClick(room.code) }}
                    style={{ cursor: 'pointer' }}
                >
                    <rect
                    x={room.x} y={room.y}
                    width={room.w} height={room.h}
                    fill={fillColour}
                    stroke={strokeColour}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    rx={6}
                    filter="url(#roomShadow)"
                    />
                    {room.label === 'Elevator' && (
                    <g transform={`translate(${room.x + room.w / 2}, ${room.y + room.h / 2 - 12})`}>
                        <circle r={9} fill="white" stroke="#475569" strokeWidth={1.2} />
                        <path d="M 0,-5 L 3,-1 L -3,-1 Z" fill="#475569" />
                        <path d="M 0,5 L 3,1 L -3,1 Z" fill="#475569" />
                    </g>
                    )}
                    <text
                    x={room.x + room.w / 2}
                    y={room.y + room.h / 2 - (isNonBookable ? 0 : 8) + (room.label === 'Elevator' ? 14 : 0)}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="600"
                    fill="#1e293b"
                    >
                    {room.label}
                    </text>
                    {!isNonBookable && isAvailable !== null && (
                    <>
                        <text
                        x={room.x + room.w / 2}
                        y={room.y + room.h / 2 + 10}
                        textAnchor="middle"
                        fontSize={9}
                        fill={isAvailable ? '#16a34a' : '#dc2626'}
                        >
                        {isAvailable ? 'Available' : 'Booked'}
                        </text>
                        <text
                        x={room.x + room.w / 2}
                        y={room.y + room.h - 6}
                        textAnchor="middle"
                        fontSize={8}
                        fill="#94a3b8"
                        >
                        {room.code}
                        </text>
                    </>
                    )}
                </g>
                )
            })}

            {(FLOOR_WALLS[`${activeBuilding}-${activeFloor}`] || []).map((w, i) => (
                <path
                    key={`wall-${i}`}
                    d={wallPathD(w.points, w.smooth)}
                    fill="none"
                    stroke="#1e293b" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
                />
            ))}

            {(FLOOR_DOORS[`${activeBuilding}-${activeFloor}`] || []).map((d, i) => {
                const p = doorPaths(d)
                return (
                    <g key={`door-${i}`}>
                        <path d={p.gap} stroke="#f8fafc" strokeWidth={8} strokeLinecap="round" />
                        <path d={p.leaf} fill="none" stroke="#475569" strokeWidth={3} strokeLinecap="round" />
                        <path d={p.arc} fill="none" stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="4 2" />
                    </g>
                )
            })}

            {(FLOOR_STAIRS[`${activeBuilding}-${activeFloor}`] || []).map((s, i) => {
                const isVertical = s.h >= s.w
                const treadCount = Math.max(3, Math.round((isVertical ? s.h : s.w) / 14))
                const treads = []
                for (let t = 1; t < treadCount; t++) {
                    if (isVertical) {
                        const ty = s.y + (s.h / treadCount) * t
                        treads.push(<line key={t} x1={s.x} y1={ty} x2={s.x + s.w} y2={ty} stroke="#94a3b8" strokeWidth={1} />)
                    } else {
                        const tx = s.x + (s.w / treadCount) * t
                        treads.push(<line key={t} x1={tx} y1={s.y} x2={tx} y2={s.y + s.h} stroke="#94a3b8" strokeWidth={1} />)
                    }
                }
                return (
                <g key={`stairs-${i}`}>
                    <rect
                        x={s.x} y={s.y} width={s.w} height={s.h} rx={2}
                        fill="#f1f5f9" stroke="#475569" strokeWidth={1.5}
                    />
                    {treads}
                    <g transform={`translate(${s.x + s.w / 2}, ${s.y + s.h / 2})`}>
                        <circle r={11} fill="white" stroke="#475569" strokeWidth={1.2} />
                        <path
                            d="M -6,6 L -6,3 L -3,3 L -3,0 L 0,0 L 0,-3 L 3,-3 L 3,-6 L 6,-6"
                            fill="none" stroke="#475569" strokeWidth={1.4}
                            strokeLinecap="round" strokeLinejoin="round"
                        />
                    </g>
                </g>
                )
            })}

            {navigationPath.length > 1 && (() => {
                const key = `${activeBuilding}-${activeFloor}`
                const t = NODE_TRANSFORM[key] || { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
                const toScaled = pts => pts
                    .filter(p => p.floor === activeFloor)
                    .map(p => ({
                        x: Math.round(p.x * t.scaleX + t.offsetX),
                        y: Math.round(p.y * t.scaleY + t.offsetY),
                    }))

                const stepIdx = navigationPath.findIndex(p => p.id === currentNodeId)
                const walked = stepIdx >= 0 ? toScaled(navigationPath.slice(0, stepIdx + 1)) : []
                const remaining = stepIdx >= 0 ? toScaled(navigationPath.slice(stepIdx)) : toScaled(navigationPath)

                return (
                <>
                    {walked.length > 1 && (
                    <polyline
                        points={walked.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={3}
                        strokeDasharray="2 4"
                    />
                    )}
                    {remaining.length > 1 && (
                    <polyline
                        points={remaining.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#1d4ed8"
                        strokeWidth={3}
                        strokeDasharray="8 6"
                    />
                    )}
                </>
                )
            })()}

            {settingPosition && floorNodes
                .filter(n => ['junction','staircase','building_entry','entrance'].includes(n.type))
                .map(n => (
                <g
                    key={`pos-${n.id}`}
                    onClick={(e) => { e.stopPropagation(); onNodeClick && onNodeClick(n.id) }}
                    style={{ cursor: 'pointer' }}
                >
                    <circle cx={n.x} cy={n.y} r={16} fill="#7c3aed" opacity={0.15}/>
                    <circle cx={n.x} cy={n.y} r={8}  fill="#7c3aed" opacity={0.85}/>
                    <text
                    x={n.x} y={n.y - 14}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#7c3aed"
                    >
                    {n.id.split('-').slice(2).join('-')}
                    </text>
                </g>
                ))
            }

            {currentNodeId && floorNodes
                .filter(n => n.id === currentNodeId)
                .map(n => (
                <g
                    key="current-pos"
                    transform={`translate(${n.x}, ${n.y})`}
                    style={{ transition: 'transform 0.8s ease-in-out' }}
                >
                    <circle r={16} fill="#1d4ed8" opacity={0.15}/>
                    <circle r={9}  fill="#1d4ed8"/>
                    <circle r={4}  fill="white"/>
                    <text
                    y={-18}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="600"
                    fill="#1d4ed8"
                    >
                    You
                    </text>
                </g>
                ))
            }

            </svg>

            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '14px',
                padding: '10px 14px', background: '#f8fafc',
                borderRadius: '0 0 10px 10px',
                borderLeft: `1px solid ${colour}`,
                borderRight: `1px solid ${colour}`,
                borderBottom: `1px solid ${colour}`,
                fontSize: '11px', color: '#475569',
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: '#dcfce7', border: '1.5px solid #16a34a' }} />
                    Free to book
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: '#fee2e2', border: '1.5px solid #dc2626' }} />
                    Booked
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: '#e2e8f0', border: '1.5px solid #94a3b8' }} />
                    Not bookable
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width={14} height={14} viewBox="-8 -8 16 16">
                        <circle r={7} fill="white" stroke="#475569" strokeWidth={1.2} />
                        <path d="M -3,3 L -3,1 L -1,1 L -1,-1 L 1,-1 L 1,-3 L 3,-3"
                            fill="none" stroke="#475569" strokeWidth={1.2}
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Stairs
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width={14} height={14} viewBox="-8 -8 16 16">
                        <circle r={7} fill="white" stroke="#475569" strokeWidth={1.2} />
                        <path d="M 0,-4 L 2,-1 L -2,-1 Z" fill="#475569" />
                        <path d="M 0,4 L 2,1 L -2,1 Z" fill="#475569" />
                    </svg>
                    Elevator
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width={14} height={14} viewBox="0 0 14 14">
                        <path d="M 2,12 L 2,2" fill="none" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
                        <path d="M 2,2 A 10 10 0 0 0 12,12" fill="none" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2 1.5" />
                    </svg>
                    Door
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1d4ed8', border: '2px solid white', boxShadow: '0 0 0 1px #1d4ed8' }} />
                    Your location
                </span>
            </div>
        </div>
        )
    }

    return (
        <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
        {view === VIEW.CAMPUS ? renderCampusView() : renderBuildingView()}
        </div>
    )
}

export default CampusMap