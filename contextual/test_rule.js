
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
