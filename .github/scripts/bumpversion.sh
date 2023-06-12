VERSION=($(egrep -o '[0-9]+' ./src/VERSION.ts))
VERSION_PATCH=${VERSION[2]}
NEW_VERSION_PATCH=$(( VERSION_PATCH + 1 ))
VERSION_FOR_OUTPUT=${VERSION[0]}.${VERSION[1]}.$NEW_VERSION_PATCH
VERSION_STRING="export const VERSION = '$VERSION_FOR_OUTPUT'"
echo $VERSION_STRING > ./src/VERSION.ts
echo "TAG_NAME=$VERSION_FOR_OUTPUT" >> $GITHUB_OUTPUT
tag="<img src=\"https://img.shields.io/badge/Version-$VERSION_FOR_OUTPUT-blue?style=flat/\"/>"
sed -i "1s@.*@$badge@" ./README.md
