# Building antlr-ng

Most programmers do not need the information on this page because they will simply download the Node.js package from NPM (see also [Getting Started](/getting-started)).

For all others here's the (short) step list to create a new production build or even a complete Node.js package. Remember, you need Node.js installed on your machine.

1. Get the code from Github (https://github.com/antlr-ng/antlr-ng)
2. Open a terminal in the folder where you stored the <span class="antrlng">antlr-ng</span> repo clone and install all dependencies:

```bash
> npm i
```

3. Once the installation is finish run:

```bash
npm run build
```

which will start vite and generate the `dist` folder with the transformed code.

If you want to build the full package run:

```bash
npm package
```

There's nothing more here - can't be any simpler.
