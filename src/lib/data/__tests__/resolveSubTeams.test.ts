import { describe, it, expect } from "vitest";
import { extractSquadLevel } from "../queries";

describe("extractSquadLevel", () => {
  it("correctly identifies high school squad levels", () => {
    expect(extractSquadLevel("Varsity Girls")).toBe("Varsity");
    expect(extractSquadLevel("Girls Varsity")).toBe("Varsity");
    expect(extractSquadLevel("JV Girls")).toBe("JV");
    expect(extractSquadLevel("Junior Varsity")).toBe("JV");
    expect(extractSquadLevel("Girls Junior Varsity")).toBe("JV");
    expect(extractSquadLevel("JV Gold")).toBe("JV Gold");
    expect(extractSquadLevel("JV Navy")).toBe("JV Navy");
    expect(extractSquadLevel("Freshman Girls")).toBe("Freshman");
    expect(extractSquadLevel("Frosh")).toBe("Freshman");
  });

  it("correctly identifies club squad levels", () => {
    expect(extractSquadLevel("U12 Elite")).toBe("Elite");
    expect(extractSquadLevel("U12 Elite LM")).toBe("LM");
    expect(extractSquadLevel("U12 Elite DC")).toBe("DC");
    expect(extractSquadLevel("DC United 2012")).toBe("DC");
    expect(extractSquadLevel("LM Stars 2012")).toBe("LM");
    expect(extractSquadLevel("U14 Premier")).toBe("Premier");
  });

  it("leaves standard team names unchanged when no squad keyword matches", () => {
    expect(extractSquadLevel("Concorde Fire U10")).toBe("Concorde Fire U10");
    expect(extractSquadLevel("Atlanta United Academy")).toBe("Atlanta United Academy");
  });
});
