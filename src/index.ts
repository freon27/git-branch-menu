//
// import simplegit from 'simple-git';
//
// const git = simplegit();
// const branches = git.branch();
//
// console.log('branches', branches);


import simplegit from 'simple-git';

const git = simplegit();

git.branch((x, y) => console.log(x, y));
