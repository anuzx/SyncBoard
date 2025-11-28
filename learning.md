# Learning

1.) for pnpm we use "workspace:*" for npm we use only * , * means picking from same package

so as we are using pnpm add this in package.json of both backends after doing "npm init -y"

```
"devDependencies": {
    "@repo/typescript-config": "workspace:*",
}
```