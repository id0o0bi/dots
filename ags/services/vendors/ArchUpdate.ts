import { shAsync } from "../util";
import { ArchUpdate } from "../type";
import { setUpdates } from "../vars";

export async function getSysUpdate(): Promise<void> {
  shAsync(["checkupdates"])
    .then((out) => {
      setUpdates(out ? _convArchUpdate(out) : []);
    })
    .catch((_) => {
      setUpdates([]);
    });
}

const _convArchUpdate = (data: string): Array<ArchUpdate> => {
  return data.split("\n").map((s) => {
    let i = s.split(/\s+/);
    return {
      package: i[0],
      version: [i[1], i[3]],
    };
  });
};
