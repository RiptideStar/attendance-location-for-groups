export type Contributor = {
  name: string;
  affiliation?: string;
  url?: string;
  role?: string;
};

export const contributors: Contributor[] = [
  {
    name: "UPenn Claude Builders Club",
    affiliation: "University of Pennsylvania",
    url: "https://penncbc.com",
    role: "Founding team",
  },
];
