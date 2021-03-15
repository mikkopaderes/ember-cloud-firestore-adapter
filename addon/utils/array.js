const diff = function (a1, a2) {
  const diffs = [
    ...a1.filter(x => !a2.includes(x)),
    ...a2.filter(x => !a1.includes(x)),
  ];

  return diffs.uniq();
};

export { diff as default, diff };
