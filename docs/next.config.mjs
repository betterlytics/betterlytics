import nextra from "nextra";

const withNextra = nextra({});

export default withNextra({
  output: "standalone",
  basePath: "/docs",
});
