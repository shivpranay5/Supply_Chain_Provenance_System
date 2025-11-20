#!/bin/bash

echo "🔧 Fixing Compilation Issue..."
echo ""

# Create reference directory if it doesn't exist
mkdir -p reference

# Move problematic file if it exists
if [ -f "contracts/PartLifecycle_Original.sol" ]; then
    echo "Moving PartLifecycle_Original.sol to reference folder..."
    mv contracts/PartLifecycle_Original.sol reference/
    echo "✅ File moved"
else
    echo "✅ File already moved or doesn't exist"
fi

# Clean old compilation artifacts
echo ""
echo "Cleaning old compilation artifacts..."
rm -rf cache artifacts
echo "✅ Cleaned"

# Show what's in contracts folder
echo ""
echo "Current contracts folder:"
ls -la contracts/

echo ""
echo "🎯 Now try: npx hardhat compile"
