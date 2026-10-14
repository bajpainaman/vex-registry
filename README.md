# vex-registry

A package registry for [Vx](https://vxlang.org), used by
[vex](https://github.com/bajpainaman/vex). Browse it at
**https://bajpainaman.github.io/vex-registry/**.

This is a demo for [vx-lang/Vx#1275](https://github.com/vx-lang/Vx/issues/1275). It may move or
be replaced.

## Use it

```sh
export VEX_REGISTRY=https://bajpainaman.github.io/vex-registry
vex add intmath
vex run
```

## How it works

The registry is plain files, served by GitHub Pages:

```
index/<name>.jsonl                       one line per published version
archives/<name>/<name>-<version>.tar.gz  the package
owners/<name>                            GitHub logins that may publish <name>, one per line
```

There is no server and no account system. To publish, open a pull request.

## Publish a package

1. Fork this repository and clone your fork.
2. In your package, run `vex publish --registry <your clone>`. It writes the archive and adds
   one index line.
3. For a new package, add `owners/<name>` with your GitHub login.
4. Open a pull request.

The pull request check refuses it unless:

- it only adds archives and index lines, and changes nothing else;
- you are listed in `owners/<name>`, or the package is new and the pull request adds you;
- `vex registry verify` passes: every archive matches its SHA-256 and its index line, and every
  dependency is in the registry.

A published version never changes. To fix a mistake, publish a new version.

`seed/` holds the source of the first packages.
