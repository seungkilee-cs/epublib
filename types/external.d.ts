// Global ambient declarations for the EPUB Reader workspace.

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// Ensure JSX namespace exists for packages compiling with isolatedModules.
import "react";
