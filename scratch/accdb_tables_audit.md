# Legacy MS Access Database Schema Audit
Database: IHS Girls Soccer - Most Recent.accdb

## Table: BeepInformation (91 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| ID | Type_4 | 4 | False | AutoIncrement |
| Run | Type_7 | 8 | False |  |
| Distance | Type_4 | 4 | False |  |

**Indexes:**
- PrimaryKey: (ID) [Primary: True, Unique: True]

---

## Table: BeepResults (629 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| PlayerID | Type_4 | 4 | True |  |
| SeasonID | Type_4 | 4 | True |  |
| RunDate | Type_8 | 8 | False |  |
| RunNo | Type_4 | 4 | True |  |
| EndRun | Type_7 | 8 | False |  |

**Indexes:**
- PlayerTableBeepResults: (PlayerID) [Primary: False, Unique: False]
- PrimaryKey: (PlayerID, SeasonID, RunNo) [Primary: True, Unique: True]
- SeasonID: (SeasonID) [Primary: False, Unique: False]

---

## Table: DatabaseDefaults (1 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| ID | Type_4 | 4 | False | AutoIncrement |
| SchoolName | Type_10 | 255 | False |  |
| Team | Type_10 | 255 | False |  |
| Nickname | Type_10 | 255 | False |  |
| SchoolPrimaryColor | Type_10 | 255 | False |  |
| SchoolSecondaryColor | Type_10 | 255 | False |  |
| SchoolTertiaryColor | Type_10 | 255 | False |  |
| TeamLogo | Type_101 | 4 | False |  |
| SchoolAddress | Type_10 | 255 | False |  |
| SchoolCity | Type_10 | 255 | False |  |
| SchoolState | Type_10 | 2 | False |  |
| SchoolZip | Type_10 | 255 | False |  |
| School Phone | Type_10 | 255 | False |  |
| TeamGender | Type_10 | 1 | False |  |
| FormsLayout | Type_1 | 1 | False |  |
| FirstEntry | Type_1 | 1 | False |  |
| HomeLocation | Type_4 | 4 | False |  |
| FileLocation | Type_10 | 255 | False |  |

**Indexes:**
- PrimaryKey: (ID) [Primary: True, Unique: True]

---

## Table: Games_InGame_Event_Times (1260 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| GameEventID | Type_4 | 4 | False | AutoIncrement |
| GameID | Type_4 | 4 | True |  |
| Event | Type_4 | 4 | False |  |
| TimeBegin | Type_7 | 8 | False |  |
| TimeEnd | Type_7 | 8 | False |  |
| PeriodEventTime | Type_4 | 4 | False |  |
| EventTime | Type_4 | 4 | False |  |
| Details | Type_12 | 0 | False |  |
| StoppedTime | Type_7 | 8 | False |  |
| StopClock | Type_1 | 1 | False |  |

**Indexes:**
- GameEventIDGameID: (GameEventID, GameID) [Primary: False, Unique: False]
- Games_InGame_Event_TypesGames_InGame_Event_Times: (Event) [Primary: False, Unique: False]
- GamesTableGames_InGame_Event_Times: (GameID) [Primary: False, Unique: False]
- PrimaryKey: (GameEventID) [Primary: True, Unique: True]

---

## Table: Games_InGame_Event_Types (8 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| ID | Type_4 | 4 | False | AutoIncrement |
| Event | Type_10 | 255 | False |  |
| EventAbbrev | Type_10 | 2 | False |  |

**Indexes:**
- Games_InGame_Event_TypesEvent: (Event) [Primary: False, Unique: False]
- PrimaryKey: (ID) [Primary: True, Unique: True]

---

## Table: GamesInfoTimes (572 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| GameGameInfoTimesID | Type_4 | 4 | True |  |
| Period | Type_4 | 4 | True |  |
| PeriodStartTime | Type_8 | 8 | False |  |
| PeriodEndTime | Type_8 | 8 | False |  |
| TotalPeriodTime | Type_7 | 8 | False |  |
| DefaultPeriodTime | Type_4 | 4 | False |  |
| PlayedPeriodTime | Type_4 | 4 | False |  |

**Indexes:**
- GamesTableGamesInfoTimes: (GameGameInfoTimesID) [Primary: False, Unique: False]
- PrimaryKey: (GameGameInfoTimesID, Period) [Primary: True, Unique: True]

---

## Table: GamesTable (568 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| GameID | Type_4 | 4 | False | AutoIncrement |
| SeasonIDGames | Type_4 | 4 | False |  |
| Date | Type_8 | 8 | False |  |
| Time | Type_8 | 8 | False |  |
| DepartureTime | Type_8 | 8 | False |  |
| Opponent | Type_4 | 4 | True |  |
| Class | Type_10 | 5 | False |  |
| LocationIDGames | Type_4 | 4 | False |  |
| HomeGame | Type_1 | 1 | False |  |
| DistrictMatch | Type_1 | 1 | False |  |
| GameTypeIDGames | Type_4 | 4 | True |  |
| Comment | Type_12 | 0 | False |  |
| CornersFor | Type_4 | 4 | False |  |
| CornersAgainst | Type_4 | 4 | False |  |
| FoulsFor | Type_4 | 4 | False |  |
| FoulsAgainst | Type_4 | 4 | False |  |
| OffsideFor | Type_4 | 4 | False |  |
| OffsideAgainst | Type_4 | 4 | False |  |
| CurrentGK | Type_4 | 4 | False |  |
| SOifTied | Type_1 | 1 | False |  |
| OTifTied | Type_1 | 1 | False |  |
| MaxOTPeriods | Type_4 | 4 | False |  |
| OT1Minutes | Type_4 | 4 | False |  |
| OT2Minutes | Type_4 | 4 | False |  |
| RegPeriods | Type_4 | 4 | False |  |

**Indexes:**
- Date: (Date) [Primary: False, Unique: False]
- DateGameID: (Date, GameID) [Primary: False, Unique: False]
- GameTypeID: (GameTypeIDGames) [Primary: False, Unique: False]
- GameTypesTableGamesTable: (GameTypeIDGames) [Primary: False, Unique: False]
- HighSchoolsTableGamesTable: (Opponent) [Primary: False, Unique: False]
- HomeGame: (HomeGame) [Primary: False, Unique: False]
- LocationID: (LocationIDGames) [Primary: False, Unique: False]
- Opponent: (Opponent) [Primary: False, Unique: False]
- PrimaryKey: (GameID) [Primary: True, Unique: True]
- Season: (SeasonIDGames) [Primary: False, Unique: False]

---

## Table: GameTypesTable (10 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| GameTypeID | Type_4 | 4 | False | AutoIncrement |
| GameType | Type_10 | 50 | False |  |
| TimeOfSeason | Type_4 | 4 | False |  |
| TimeOfSeason2 | Type_10 | 50 | False |  |
| TimeOfSeason3 | Type_4 | 4 | False |  |

**Indexes:**
- PrimaryKey: (GameTypeID) [Primary: True, Unique: True]

---

## Table: GoalsAgainst (383 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| GoalsAgainst# | Type_4 | 4 | False | AutoIncrement |
| GameEventID | Type_4 | 4 | False |  |
| ScoredOnPlayer# | Type_4 | 4 | False |  |
| GameWinner | Type_1 | 1 | False |  |
| PenaltyKick | Type_1 | 1 | False |  |
| CornerKick | Type_1 | 1 | False |  |
| ThrowIn | Type_1 | 1 | False |  |
| DirectKick | Type_1 | 1 | False |  |
| IndirectKick | Type_1 | 1 | False |  |

**Indexes:**
- GameEventID: (GameEventID) [Primary: False, Unique: False]
- ScoredOnPlayer#: (ScoredOnPlayer#) [Primary: False, Unique: False]

---

## Table: GoalsFor (739 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| GoalsFor# | Type_4 | 4 | False | AutoIncrement |
| GameEventID | Type_4 | 4 | False |  |
| Scorer# | Type_4 | 4 | False |  |
| AssistedBy# | Type_4 | 4 | False |  |
| GameWinner | Type_1 | 1 | False |  |
| CornerKick | Type_1 | 1 | False |  |
| ThrowIn | Type_1 | 1 | False |  |
| PenaltyKick | Type_1 | 1 | False |  |
| DirectKick | Type_1 | 1 | False |  |
| IndirectKick | Type_1 | 1 | False |  |
| Header | Type_1 | 1 | False |  |

**Indexes:**
- AssistedBy#: (AssistedBy#) [Primary: False, Unique: False]
- GameEventID: (GameEventID) [Primary: False, Unique: False]
- PrimaryKey: (GoalsFor#) [Primary: True, Unique: True]
- Scorer#: (Scorer#) [Primary: False, Unique: False]

---

## Table: HighSchoolsTable (432 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| HighSchoolID | Type_4 | 4 | False | AutoIncrement |
| HighSchoolName | Type_10 | 50 | False |  |
| HighSchoolAddress | Type_10 | 50 | False |  |
| HighSchoolCity | Type_10 | 50 | False |  |
| HighSchoolZip | Type_10 | 50 | False |  |
| HighSchoolClassification | Type_10 | 5 | False |  |
| HighSchoolPhone | Type_10 | 50 | False |  |
| HighSchoolGirlsCoach | Type_10 | 50 | False |  |
| HighSchoolGirlsCoachPhone | Type_10 | 50 | False |  |
| HighSchoolRegion | Type_10 | 10 | False |  |
| HighSchoolDistrict | Type_10 | 5 | False |  |
| HighSchoolGirlsTeam | Type_1 | 1 | False |  |
| HighSchoolGirlsCoachEmail | Type_10 | 50 | False |  |

**Indexes:**
- HighSchoolID: (HighSchoolID) [Primary: False, Unique: False]
- HighSchoolName: (HighSchoolName) [Primary: False, Unique: False]
- PrimaryKey: (HighSchoolID) [Primary: True, Unique: True]

---

## Table: InGameStats (5629 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| SubUniqueID | Type_4 | 4 | False | AutoIncrement |
| GameIDInGame | Type_4 | 4 | False |  |
| PlayerNoOut | Type_4 | 4 | False |  |
| PlayerNoIn | Type_4 | 4 | False |  |
| Period | Type_4 | 4 | False |  |
| Minute | Type_4 | 4 | False |  |
| GameMinute | Type_4 | 4 | False |  |

**Indexes:**
- Game#: (GameIDInGame, PlayerNoIn) [Primary: False, Unique: False]
- GameIDInGame: (GameIDInGame, Period) [Primary: False, Unique: False]
- InGameStatsGame#: (GameIDInGame) [Primary: False, Unique: False]
- Period: (Period) [Primary: False, Unique: False]
- PlayerNoOut: (PlayerNoOut) [Primary: False, Unique: False]
- PrimaryKey: (SubUniqueID) [Primary: True, Unique: True]
- SubUniqueID: (SubUniqueID) [Primary: False, Unique: False]

---

## Table: LocationTable (71 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| LocationID | Type_4 | 4 | False | AutoIncrement |
| Location | Type_10 | 50 | False |  |
| TravelTime | Type_10 | 25 | False |  |

**Indexes:**
- LocationTableLocation: (Location) [Primary: False, Unique: False]
- PrimaryKey: (LocationID) [Primary: True, Unique: True]

---

## Table: ParentTable (85 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| ID | Type_4 | 4 | False | AutoIncrement |
| ParentFirst | Type_10 | 50 | False |  |
| ParentLast | Type_10 | 50 | False |  |
| ParentCell | Type_10 | 50 | False |  |
| ParentEmail | Type_10 | 50 | False |  |
| ParentEmail2 | Type_10 | 50 | False |  |
| ParentEmail3 | Type_10 | 50 | False |  |

**Indexes:**
- PrimaryKey: (ID) [Primary: True, Unique: True]

---

## Table: PastSeasonStats (29 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| PlayerID# | Type_4 | 4 | True |  |
| SeasonID | Type_4 | 4 | False |  |
| Season | Type_4 | 4 | True |  |
| Goals | Type_4 | 4 | False |  |
| Assists | Type_4 | 4 | False |  |
| GoalsAgainst | Type_4 | 4 | False |  |
| Saves | Type_4 | 4 | False |  |

**Indexes:**
- PlayerID#: (PlayerID#, SeasonID) [Primary: False, Unique: False]
- PrimaryKey: (PlayerID#, Season) [Primary: True, Unique: True]
- SeasonID: (SeasonID) [Primary: False, Unique: False]

---

## Table: PastStatsGameScores (33 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Game# | Type_4 | 4 | True |  |
| IndyScore | Type_4 | 4 | False |  |
| OpponentScore | Type_4 | 4 | False |  |

**Indexes:**
- PrimaryKey: (Game#) [Primary: True, Unique: True]

---

## Table: PlayerAwards (18 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| ID | Type_4 | 4 | False | AutoIncrement |
| Award Name | Type_10 | 255 | False |  |

**Indexes:**
- PrimaryKey: (ID) [Primary: True, Unique: True]

---

## Table: PlayerAwardsEarned (204 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| ID | Type_4 | 4 | False | AutoIncrement |
| AwardID | Type_4 | 4 | False |  |
| PlayerID | Type_4 | 4 | False |  |
| SeasonID | Type_4 | 4 | False |  |

**Indexes:**
- AwardID: (AwardID) [Primary: False, Unique: False]
- PlayerID: (PlayerID) [Primary: False, Unique: False]
- PrimaryKey: (ID) [Primary: True, Unique: True]
- SeasonID: (SeasonID) [Primary: False, Unique: False]

---

## Table: Player-GameInfo (8016 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| PlayerIDPlayerGameInfo | Type_4 | 4 | True |  |
| GameIDPlayerGameInfo | Type_4 | 4 | True |  |
| Start | Type_1 | 1 | False |  |
| Shots | Type_4 | 4 | False |  |
| Saves | Type_4 | 4 | False |  |
| YellowCard | Type_1 | 1 | False |  |
| RedCard | Type_1 | 1 | False |  |
| YellowCardReason | Type_12 | 0 | False |  |
| RedCardReason | Type_12 | 0 | False |  |
| MinInGoal | Type_4 | 4 | False |  |
| Injured | Type_1 | 1 | False |  |
| InMinutes | Type_4 | 4 | False |  |
| OutMinutes | Type_4 | 4 | False |  |
| StartMinutes | Type_4 | 4 | False |  |
| MinPlayedGame | Type_7 | 8 | False |  |
| Plus | Type_4 | 4 | False |  |
| Minus | Type_4 | 4 | False |  |
| Dressed | Type_1 | 1 | False |  |

**Indexes:**
- Game#: (GameIDPlayerGameInfo, PlayerIDPlayerGameInfo) [Primary: False, Unique: False]
- GamesTablePlayer-GameInfo: (GameIDPlayerGameInfo) [Primary: False, Unique: False]
- Player-GameInfoGame#: (GameIDPlayerGameInfo) [Primary: False, Unique: False]
- PlayerID: (PlayerIDPlayerGameInfo) [Primary: False, Unique: False]
- PlayerTablePlayer-GameInfo: (PlayerIDPlayerGameInfo) [Primary: False, Unique: False]
- PrimaryKey: (PlayerIDPlayerGameInfo, GameIDPlayerGameInfo) [Primary: True, Unique: True]
- Start: (Start) [Primary: False, Unique: False]

---

## Table: PlayerSeasonLetters (420 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Varsity Letter | Type_1 | 1 | False |  |
| Number Patch | Type_4 | 4 | False |  |
| Certificate | Type_1 | 1 | False |  |
| Bar | Type_1 | 1 | False |  |
| Ball | Type_1 | 1 | False |  |
| Player# | Type_4 | 4 | True |  |
| SeasonID | Type_4 | 4 | True |  |
| NumberPatchNeeded | Type_1 | 1 | False |  |
| VarsityPatchNeeded | Type_1 | 1 | False |  |

**Indexes:**
- Number Patch: (Number Patch) [Primary: False, Unique: False]
- NumberPatchNeeded: (NumberPatchNeeded) [Primary: False, Unique: False]
- PrimaryKey: (Player#, SeasonID) [Primary: True, Unique: True]
- SeasonID: (SeasonID) [Primary: False, Unique: False]

---

## Table: PlayerSeasonTable (750 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Player# | Type_4 | 4 | True |  |
| SeasonID | Type_4 | 4 | True |  |
| Roster# | Type_4 | 4 | False |  |
| AltRoster# | Type_4 | 4 | False |  |
| GKRoster# | Type_10 | 100 | False |  |
| Grade | Type_4 | 4 | False |  |
| ParticipatingThisYear | Type_1 | 1 | False |  |
| Captain | Type_1 | 1 | False |  |
| Starter | Type_1 | 1 | False |  |
| ParentLivingHome | Type_1 | 1 | False |  |
| Enrolled12months | Type_1 | 1 | False |  |
| ParticipateLastYear | Type_1 | 1 | False |  |
| EarnedCredits | Type_4 | 4 | False |  |
| Varsity | Type_1 | 1 | False |  |
| JuniorVarsity | Type_1 | 1 | False |  |
| Position | Type_10 | 50 | False |  |
| Picture | Type_11 | 0 | False |  |

**Indexes:**
- Grade: (Grade) [Primary: False, Unique: False]
- ParticipatingThisYear: (ParticipatingThisYear) [Primary: False, Unique: False]
- PlayerTablePlayer#: (Player#) [Primary: False, Unique: False]
- PrimaryKey: (Player#, SeasonID) [Primary: True, Unique: True]
- Season: (SeasonID) [Primary: False, Unique: False]
- Season0: (SeasonID) [Primary: False, Unique: False]
- SeasonID: (SeasonID, Player#) [Primary: False, Unique: False]

---

## Table: PlayerTable (299 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| PlayerID | Type_4 | 4 | False | AutoIncrement |
| PlayerFirstName | Type_10 | 50 | False |  |
| PlayerLastName | Type_10 | 50 | False |  |
| PlayerNickName | Type_10 | 50 | False |  |
| PlayerAddress | Type_10 | 50 | False |  |
| PlayerCity | Type_10 | 50 | False |  |
| PlayerZip | Type_10 | 50 | False |  |
| PlayerFather | Type_4 | 4 | False |  |
| PlayerMother | Type_4 | 4 | False |  |
| PlayerHomePhone | Type_10 | 50 | False |  |
| PlayerCellPhone | Type_10 | 50 | False |  |
| PlayerEmail | Type_10 | 100 | False |  |
| PlayerDateOfBirth | Type_8 | 8 | False |  |
| PlayerYearEntered9th | Type_4 | 4 | False |  |
| PlayerSex | Type_10 | 1 | False |  |
| PlayerCreditsRequiredGrad | Type_4 | 4 | False |  |
| PlayerFullName | Type_10 | 243 | False |  |
| FinalYear | Type_4 | 4 | False |  |

**Indexes:**
- PlayerID: (PlayerID) [Primary: False, Unique: False]
- PlayerLastNamePlayerFirstName: (PlayerLastName, PlayerFirstName) [Primary: False, Unique: False]
- PlayerSex: (PlayerSex) [Primary: False, Unique: False]
- PrimaryKey: (PlayerID) [Primary: True, Unique: True]

---

## Table: SeasonTable (22 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| SeasonID | Type_4 | 4 | False | AutoIncrement |
| Season | Type_4 | 4 | True |  |
| SchoolYear | Type_10 | 9 | False |  |
| HeadCoachName | Type_10 | 50 | False |  |
| AssistantCoachName | Type_10 | 50 | False |  |
| TrainerName | Type_10 | 50 | False |  |
| Principal | Type_10 | 50 | False |  |
| ManagerName | Type_10 | 50 | False |  |
| TeamName | Type_10 | 50 | False |  |
| TeamMascot | Type_10 | 50 | False |  |
| Assistant Principals | Type_10 | 100 | False |  |
| Athletic Director | Type_10 | 100 | False |  |

**Indexes:**
- PrimaryKey: (SeasonID) [Primary: True, Unique: True]
- SeasonTableSeason: (Season) [Primary: False, Unique: False]

---

## Table: ShootoutTable (21 records)
| Field Name | Type | Size | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Game# | Type_4 | 4 | True |  |
| KickID | Type_4 | 4 | False | AutoIncrement |
| Kick# | Type_4 | 4 | False |  |
| Kicker | Type_4 | 4 | False |  |
| Result | Type_1 | 1 | False |  |
| OppKick# | Type_4 | 4 | False |  |
| OppResult | Type_1 | 1 | False |  |
| GK | Type_4 | 4 | False |  |
| Save | Type_1 | 1 | False |  |
| s_ColLineage | Type_11 | 0 | False |  |
| s_Generation | Type_4 | 4 | False |  |
| s_GUID | Type_15 | 16 | False |  |
| s_Lineage | Type_11 | 0 | False |  |

**Indexes:**
- Game#: (Game#) [Primary: False, Unique: False]
- Kick#: (Kick#) [Primary: False, Unique: False]
- KickID: (KickID) [Primary: False, Unique: False]
- OppKick#: (OppKick#) [Primary: False, Unique: False]
- PrimaryKey: (Game#, KickID) [Primary: True, Unique: True]
- s_Generation: (s_Generation) [Primary: False, Unique: False]
- s_GUID: (s_GUID) [Primary: False, Unique: True]

---

