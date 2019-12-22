import simplegit from 'simple-git';
import { terminal } from 'terminal-kit';
import { BehaviorSubject } from 'rxjs';
import { BranchSummary } from 'simple-git/promise';
import { map, withLatestFrom } from 'rxjs/operators';

enum ListType {
  local,
  remote
}

// const clientHeight$ = fromEvent(terminal, 'resize');
//   .pipe(map((event: number[]) => event[1]));
const branches$ = new BehaviorSubject<string[]>([]);
const type$ = new BehaviorSubject<ListType>(ListType.local);
const git = simplegit();

// git.branch((x, y) => console.log('local branch', x, y));
// setTimeout(() => process.exit(), 400);

function terminate() {
  terminal.grabInput(false);
  terminal.clear();
  setTimeout(function() {
    terminal.processExit();
  }, 100);
}

// @ts-ignore
terminal.on('key', function(name, matches, data) {
  if (name === 'CTRL_C') {
    terminate();
  } else if (name === 'f') {
    type$.next(
      type$.value === ListType.local ? ListType.remote : ListType.local
    );
  }
});

type$.subscribe(type => {
  const fn = type === ListType.local ? git.branchLocal : git.branch;
  fn.call(git, (_error, summary: BranchSummary) => {
    console.log(summary);
    const branchList = summary.all.filter(
      branchName => branchName !== summary.current
    );
    branches$.next(branchList);
  });
});

let menu;

branches$
  .pipe(
    withLatestFrom(type$),
    map(data => {
      const [branches, type] = data;
      data[0] =
        type === ListType.local
          ? branches
          : filterAndTransformRemotes(branches);
      return data;
    })
    // ,
    // tap(([branches, type]) => {
    //
    //
    //   if(type === ListType.local) {
    //     branches.forEach(branch =>
    //       git.log({
    //           from: branch,
    //           to: 'origin/' + branch
    //         }, (_error, log: ListLogSummary) =>
    //           console.log(log.all.length)
    //       )
    //     );
    //   }
    //}
    // )
  )
  .subscribe(([branches, type]: [string[], ListType]) => {
    terminal.reset();
    terminal.clear();
    if (menu) {
      menu.abort();
    }
    terminal.wrap.yellow(
      type === ListType.local ? 'Local branches:' : 'Remote branches:'
    );

    if (branches.length) {
      menu = terminal.singleColumnMenu(branches, {}, (_error, selection) => {
        type === ListType.local
          ? git.checkout(selection.selectedText)
          : git.checkoutBranch(
              remoteNameToLocal(selection.selectedText),
              selection.selectedText
            );
        terminal.processExit();
      });
    } else {
      terminal.wrap.white('no branches found');
    }
  });

function remoteNameToLocal(branchName: string): string {
  return branchName.replace(/^origin\//, '');
}

function filterAndTransformRemotes(branches: string[]): string[] {
  return branches
    .filter(branch => branch.match(/^remote/))
    .map(branch => branch.replace(/^remotes\//, ''));
}
