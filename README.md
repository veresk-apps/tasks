# Veresk Tasks

## Run directly on Pear
```
pear run pear://uxb61feseq6nmgpfpzfj1k3jreeo13dkhfbutzmamg6iyh6511uo
```


## Install

```
npm i -g pear
npm i
```

## Dev

Default
```
npm run dev
```

Custom storage
```
STORAGE=~/storage-1 npm run dev
```

## Release

```
npm i
npm run build
npm run install:prod
pear stage veresk-tasks-<version>
pear release veresk-tasks-<version>
```