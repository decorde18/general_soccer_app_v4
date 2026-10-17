Attribute VB_Name = "Form_GameStatsFormVersion3_Starters_Subs_Subform"
Attribute VB_Base = "0{78DDE285-E8C4-4155-8F6B-AF8812077CB8}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Option Explicit


Private Sub DeleteSub_Click()
On Error GoTo exitsub
DoCmd.SetWarnings False
DoCmd.RunCommand acCmdDeleteRecord
DoCmd.SetWarnings True
exitsub:
End Sub



Private Sub Form_Load()
Let GameIDInGame = strGameIDpub
End Sub

Private Sub GameMinute_GotFocus()
Let GameIDInGame = strGame
End Sub

Private Sub Minute_AfterUpdate()
If IsNull(Period) Then
Let Period = 1
End If
Let GameMinute = Minute + Nz(DSum("PlayedPeriodTime", "GamesInfoTimes", "[GameGameInfoTimesID]=" & strGame & " and [period]<" & ([Period])))
Call UpdatePlayerGameMinutes
End Sub

Private Sub Minute_GotFocus()
Let GameIDInGame = strGame
End Sub

Private Sub NoIn_AfterUpdate()
Let GameIDInGame = strGame
Let PlayerNoIn = NoIn
Let GameMinute = Minute + Nz(DSum("PlayedPeriodTime", "GamesInfoTimes", "[GameGameInfoTimesID]=" & strGame & " and [period]<" & Period))
Call UpdatePlayerGameMinutes
End Sub

Private Sub NoOut_AfterUpdate()
Let GameIDInGame = strGame
Let PlayerNoOut = NoOut
Let GameMinute = Minute + Nz(DSum("PlayedPeriodTime", "GamesInfoTimes", "[GameGameInfoTimesID]=" & strGame & " and [period]<" & Period))
Call UpdatePlayerGameMinutes
End Sub



Private Sub Period_AfterUpdate()
Let GameMinute = Minute + Nz(DSum("PlayedPeriodTime", "GamesInfoTimes", "[GameGameInfoTimesID]=" & strGame & " and [period]<" & Period))
Call UpdatePlayerGameMinutes
End Sub

Private Sub Period_GotFocus()
Let GameIDInGame = strGame

End Sub
