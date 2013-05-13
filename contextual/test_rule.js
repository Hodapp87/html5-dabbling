
var triangleBranchRule = {
    startRule: "top",
    rules: [
        { name: "top",
          // note that the transform is meant to apply before the rule
          children: [ { rule: "branch", scale: [100, 100], translate: [300, 300] } ] },
        { name: "branch",
          children: [ { rule: "triangle" },
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
          children: [{ rule: "tri", scale: [100, 100], translate: [300, 300]}]},
        { name: "tri",
          children: [{ rule: "triangle" },
                  { rule: "pickDir" }]},
        { name: "pickDir",
          policy: "random",
          children: [{rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [-0.577, -0.5], rotate: -0.4 },
                  {rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [0.577, -0.5], rotate: 0.5 },
                  {rule: "branch", prob: 0.7}]},
        { name: "branch",
          children: [{rule: "tri", scale: [0.8, 0.8], translate: [-0.577, -0.5], rotate: -0.3 },
                  {rule: "tri", scale: [0.8, 0.8], translate: [0.577, -0.5], rotate: 1.0 }]},

        ],
};

var triangleRandomRuleExperimental = {
    startRule: "top",
    rules: [
        { name: "top",
          // Suppose rather than 'scale' being numerical, it could be...
          //  - an expression that captures a whole list of parameters, such as
          // any user-controlled slider, time, mouse coordinates, or random
          // values (if they must be frame-constant at least)
          //  - some function that captures the same somehow
          // For the sake of preventing tons of computations, we could
          // restrict values to only what is constant across a frame, and then
          // we need only compute them once per frame, not once per iteration or
          // something ridiculous like that.
          children: [{ rule: "tri", scale: [100, 100], translate: [300, 300]}]},
        { name: "tri",
          children: [{ rule: "triangle" },
                  { rule: "pickDir" }]},
        { name: "pickDir",
          policy: "random",
          children: [{rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [-0.577, -0.5], rotate: -0.4 },
                  {rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [0.577, -0.5], rotate: 0.5 },
                  {rule: "branch", prob: 0.7}]},
        { name: "branch",
          children: [{rule: "tri", scale: [0.8, 0.8], translate: [-0.577, -0.5], rotate: -0.3 },
                  {rule: "tri", scale: [0.8, 0.8], translate: [0.577, -0.5], rotate: 1.0 }]},

        ],
};

// This is a function which returns a grammar. That grammar can vary depending
// on time and on user parameters. It is evaluated once per frame.
// Now what is a good way of declaring parameters?
// -inside the function can work, provided that it's okay with them emerging at
// the time the function is called, e.g. var trans = createParameter(-1, 1, 0);
// -outside the function can also work but is clunkier in its own way
(function (t, params) {
    var delta1 = (1 + Math.sin(t / 100)) / 2;
    var delta2 = (1 + Math.cos(t / 100)) / 2;
    console.log("delta1: " + delta1 + ", delta2: " + delta2);
    return {
        startRule: "top",
        background: [0, 0, 100], // this is an HSV color
        rules: [
            { name: "top",
              children: [{ rule: "tri", scale: [100, 100], translate: [300, 300]}]},
            { name: "tri",
              children: [{ rule: "triangle" },
                      { rule: "pickDir" }]},
            { name: "pickDir",
              policy: "random",
              children: [{rule: "tri", prob: 0.2, scale: [0.7 * delta1, 0.7 * delta2], translate: [-0.577, -0.5], rotate: -0.4 },
                      {rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [0.577, -0.5], rotate: 0.5 },
                      {rule: "branch", prob: 0.7}]},
            { name: "branch",
              children: [{rule: "tri", scale: [0.8, 0.8], translate: [-0.577, -0.5], rotate: -0.3 },
                      {rule: "tri", scale: [0.8, 0.8], translate: [0.577, -0.5], rotate: 1.0 }]},

        ],
   };
});

var grammarStringStart2 = '{ \n\
    startRule: "top", \n\
    background: [0, 0, 100], // this is an HSV color \n\
    rules: [ \n\
        { name: "top", \n\
          children: [{ rule: "sq", scale: [600, 600], translate: [300, 300]}]}, \n\
        { name: "sq", \n\
          children: [{ rule: "square" }, \n\
                  { rule: "divide", rotate: -0.1 }]}, \n\
        { name: "divide", \n\
          policy: "random", \n\
          children: [{rule: "sq", scale: [0.75, 0.75], translate: [-0.25, -0.25], rotate: 0.5 }, \n\
                  {rule: "sq", scale: [0.6, 0.6], translate: [0.25, -0.25], rotate: -0.5 }, \n\
                  {rule: "sq", scale: [0.4, 0.4], translate: [-0.25, 0.25], rotate: 0.5 }, \n\
                  {rule: "sq", scale: [0.85, 0.85], translate: [0.25, 0.25], rotate: -0.2 }, \n\
                  {rule: "double"}]}, \n\
        { name: "double", \n\
          children: [{rule: "divide"}, \n\
                  {rule: "divide", rotate: 3.14/2}] } \n\
          \n\
        ] \n\
}; \n\
';

var grammarStringStart2 = '(function (t, params) {\n\
    var deltaX = param("delta X", 0, 500, 200);\n\
    var deltaY = param("delta Y", 0, 500, 200);\n\
    var delta1 = (1 + Math.sin(t / 100)) / 2;\n\
    var delta2 = (1 + Math.cos(t / 100)) / 2;\n\
    console.log("delta1: " + delta1 + ", delta2: " + delta2);\n\
    return {\n\
        startRule: "top",\n\
        //background: [0, 0, 0], // this is an HSV color\n\
        rules: [\n\
            { name: "top",\n\
              children: [{ rule: "tri", stroke: [0, 0, 1, 1], fill: [0, 0, 1, 1], scale: [200, 200], translate: [deltaX, deltaY]}]},\n\
            { name: "tri",\n\
              children: [{ rule: "triangle" },\n\
                      { rule: "pickDir", stroke: [0, 0, -0.05, 0], fill: [0, 0, 0, -0.3] }]},\n\
            { name: "pickDir",\n\
              policy: "random",\n\
              children: [{rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [-0.577, -0.5], rotate: -0.4 },\n\
                      {rule: "tri", prob: 0.2, scale: [0.7, 0.7], translate: [0.577, -0.5], rotate: 0.5 },\n\
                      {rule: "branch", prob: 0.7}]},\n\
            { name: "branch",\n\
              children: [{rule: "tri", scale: [0.8, 0.8], translate: [-0.577, -0.5], rotate: -0.3 },\n\
                      {rule: "tri", scale: [0.8, 0.8], translate: [0.577, -0.5], rotate: 1.0 }]},\n\
        ],\n\
   };\n\
});\n\
';

var grammarStringStart = '(function (t, params) {\n\
    var deltaX = param("delta X", 0, 500, 400);\n\
    var deltaY = param("delta Y", 0, 500, 400);\n\
  	var rot1 = param("rotation 1", -1.0, 1.0, 0.888);\n\
  	var rot2 = param("rotation 2", -1.0, 1.0, -0.856);\n\
  	console.log(rot1);\n\
    console.log(rot2);\n\
    return {\n\
        startRule: "top",\n\
        rules: [\n\
            { name: "top",\n\
              children: [{ rule: "tri", scale: [250, 250], translate: [deltaX, deltaY]}]},\n\
            { name: "tri",\n\
              children: [{ rule: "triangle" },\n\
                         { rule: "branch"}]},\n\
            { name: "branch",\n\
              children: [{rule: "tri", scale: [0.7, 0.7], translate: [-0.577, -0.5], rotate: rot1 },\n\
                         {rule: "tri", scale: [0.8, 0.8], translate: [0.577, -0.5], rotate: rot2 }]},\n\
        ],\n\
   };\n\
});\n\
';
