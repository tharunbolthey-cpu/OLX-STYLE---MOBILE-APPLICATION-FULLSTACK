export const money = (n:number) =>
  `₹${Number(n||0).toLocaleString('en-IN')}`;

export const shortDate = (d:string) =>
  new Date(d).toLocaleDateString();