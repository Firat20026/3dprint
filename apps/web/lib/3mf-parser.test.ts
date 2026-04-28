/**
 * Lightweight tests for 3MF metadata parsing.
 *
 * Run with:
 *   pnpm exec tsx lib/3mf-parser.test.ts
 *
 * The internal helpers (countPlates, extractMaterialGroups) take XML
 * strings, so we test against fixture snippets shaped like real
 * Orca/Bambu/PrusaSlicer 3MF outputs without needing a binary file.
 */
import { countPlates, extractMaterialGroups } from "./3mf-parser";

function assertEq<T>(label: string, got: T, want: T) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✓" : "✗"} ${label}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
  if (!ok) process.exitCode = 1;
}

// ── countPlates ──────────────────────────────────────────────────────────────

const noBuild = `<?xml version="1.0"?><model></model>`;
assertEq("no build → 1", countPlates(noBuild), 1);

const singlePlate = `
  <model>
    <build>
      <item objectid="1" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
    </build>
  </model>
`;
assertEq("single item → 1", countPlates(singlePlate), 1);

const threePlatesTagged = `
  <model xmlns:p="http://schemas.bambulab.com/package/2021">
    <build>
      <item objectid="1" p:plateindex="1" transform="1 0 0 0 1 0 0 0 1"/>
      <item objectid="2" p:plateindex="2" transform="1 0 0 0 1 0 0 0 1"/>
      <item objectid="3" p:plateindex="3" transform="1 0 0 0 1 0 0 0 1"/>
    </build>
  </model>
`;
assertEq("three plates tagged → 3", countPlates(threePlatesTagged), 3);

const threeItemsNoTags = `
  <model>
    <build>
      <item objectid="1"/>
      <item objectid="2"/>
      <item objectid="3"/>
    </build>
  </model>
`;
// Fallback: one plate per <item> when no plateindex attribute.
assertEq("three items no tags → 3", countPlates(threeItemsNoTags), 3);

const twoPlatesSamePlateIndex = `
  <model>
    <build>
      <item objectid="1" p:plateindex="1"/>
      <item objectid="2" p:plateindex="1"/>
      <item objectid="3" p:plateindex="2"/>
    </build>
  </model>
`;
assertEq("dedup by plateindex → 2", countPlates(twoPlatesSamePlateIndex), 2);

// ── extractMaterialGroups ────────────────────────────────────────────────────

const noMaterials = `<model><resources></resources></model>`;
assertEq("no materials → []", extractMaterialGroups(noMaterials), []);

const fourBaseMaterials = `
  <model>
    <resources>
      <basematerials id="1">
        <base name="Generic PLA Black" displaycolor="#000000FF"/>
        <base name="Generic PLA White" displaycolor="#FFFFFFFF"/>
        <base name="Generic PLA Red" displaycolor="#FF0000"/>
        <base name="Generic PLA Yellow" displaycolor="#FFFF00"/>
      </basematerials>
    </resources>
  </model>
`;
const groups = extractMaterialGroups(fourBaseMaterials);
assertEq("four base materials → 4 groups", groups.length, 4);
assertEq(
  "first material name",
  groups[0]?.name,
  "Generic PLA Black",
);
assertEq(
  "first material color (alpha stripped)",
  groups[0]?.colorHex,
  "#000000",
);
assertEq("first material extruder fallback", groups[0]?.extruderId, 1);
assertEq("fourth material extruder", groups[3]?.extruderId, 4);

// Two identical <base> entries are two distinct extruder slots — that's how
// 3MF resources work even if the labels match (e.g. user assigned the same
// filament profile to extruders 1 and 2). Document this with the test.
const sameLabelTwoSlots = `
  <model>
    <resources>
      <basematerials id="1">
        <base name="PLA" displaycolor="#000000"/>
        <base name="PLA" displaycolor="#000000"/>
      </basematerials>
    </resources>
  </model>
`;
const sameLabel = extractMaterialGroups(sameLabelTwoSlots);
assertEq("two identical entries → two slots", sameLabel.length, 2);
assertEq("slot 1 extruder", sameLabel[0]?.extruderId, 1);
assertEq("slot 2 extruder", sameLabel[1]?.extruderId, 2);

const noColor = `
  <model>
    <resources>
      <basematerials id="1">
        <base name="Mystery Filament"/>
      </basematerials>
    </resources>
  </model>
`;
const m = extractMaterialGroups(noColor);
assertEq("no color → null colorHex", m[0]?.colorHex, null);
