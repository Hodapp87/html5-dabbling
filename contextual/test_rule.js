
var triangleBranchRule = {
    startRule: "top",
    rules: [
        { name: "top",
          // note that the transform is meant to apply before the rule
          child: [ { rule: "branch", scale: [100, 100], translate: [300, 300] } ] },
        { name: "branch",
          child: [ { rule: "triangle" },
                   { rule: "branch", scale: [0.7, 0.7], translate: [-0.7, -0.6], rotate: -0.4 },
                   { rule: "branch", scale: [0.7, 0.7], translate:  [0.7, -0.6], rotate: 0.5 },
                 ]
        },
        ],
};
// TODO:
// - If you invoke a primitive, should transforms be permitted on it?
// - Special parameters for: Mouse, random values, time, network socket (maybe?)
//   - random values should be time-varying too; perhaps specify a frequency
//   - might need to be clear as to whether this is varying with depth too
// - Special rule for random, random deterministic
// - Trampoline instead of direct recursion (might be needed in some cases)

var triangleHeight = 1 / Math.sqrt(3);
var triangleRandomRule = {
    startRule: "top",
    rules: [
        { name: "top",
          child: [{ rule: "tri", scale: [100, 100], translate: [300, 300]}]},
        { name: "tri",
          child: [{ rule: "triangle" },
                  { rule: "pickDir" }]},
        { name: "pickDir",
          select: "random",
          child: [{rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [-0.577, -0.5], rotate: -0.4 },
                  {rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [0.577, -0.5], rotate: 0.5 },
                  {rule: "branch", prob: 0.7}]},
        { name: "branch",
          child: [{rule: "tri", scale: [0.8, 0.8], translate: [-0.577, -0.5], rotate: -0.3 },
                  {rule: "tri", scale: [0.8, 0.8], translate: [0.577, -0.5], rotate: 1.0 }]},

        ],
};

var squareDivide = {
    startRule: "top",
    rules: [
        { name: "top",
          child: [{ rule: "sq", scale: [600, 600], translate: [300, 300]}]},
        { name: "sq",
          child: [{ rule: "square" },
                  { rule: "divide", rotate: -0.1 }]},
        { name: "divide",
          select: "random",
          child: [{rule: "sq", scale: [0.75, 0.75], translate: [-0.25, -0.25], rotate: 0.5 },
                  {rule: "sq", scale: [0.6, 0.6], translate: [0.25, -0.25], rotate: -0.5 },
                  {rule: "sq", scale: [0.4, 0.4], translate: [-0.25, 0.25], rotate: 0.5 },
                  {rule: "sq", scale: [0.85, 0.85], translate: [0.25, 0.25], rotate: -0.2 },
                  {rule: "double"}]},
        { name: "double",
          child: [{rule: "divide"},
                  {rule: "divide", rotate: 3.14/2}] }
          
        ]
};
