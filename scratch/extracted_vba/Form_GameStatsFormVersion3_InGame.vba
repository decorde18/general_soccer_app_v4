Attribute VB_Name = "Form_GameStatsFormVersion3_InGame"
Attribute VB_Base = "0{96711E36-581F-4BDC-9F21-DCFB4CF95438}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False

Option Explicit
Public PeriodStoppedTime As Integer



Private Sub CCornerAgMinus_Click()
CornersAgainst = Nz(CornersAgainst, 0) - 1
If CornersAgainst = -1 Then
CornersAgainst = 0
End If
End Sub

Private Sub CCornerAgPlus_Click()
CornersAgainst = Nz(CornersAgainst, 0) + 1
End Sub

Private Sub CCornerMinus_Click()
CornersFor = Nz(CornersFor, 0) - 1
If CornersFor = -1 Then
CornersFor = 0
End If
End Sub

Private Sub CCornerPlus_Click()
CornersFor = Nz(CornersFor, 0) + 1
End Sub

Private Sub CFoulAgMinus_Click()
FoulsAgainst = Nz(FoulsAgainst, 0) - 1
If FoulsAgainst = -1 Then
FoulsAgainst = 0
End If
End Sub

Private Sub CFoulAgPlus_Click()
FoulsAgainst = Nz(FoulsAgainst, 0) + 1
End Sub

Private Sub CFoulMinus_Click()
FoulsFor = Nz(FoulsFor, 0) - 1
If FoulsFor = -1 Then
FoulsFor = 0
End If
End Sub

Private Sub CFoulPlus_Click()
FoulsFor = Nz(FoulsFor, 0) + 1
End Sub

Private Sub ClockAdjustDown_Click()
If ClockUpOrDown = 1 Then
strAdjStopTime = strAdjStopTime - 1
Else: strAdjStopTime = strAdjStopTime + 1
End If
End Sub

Private Sub ClockAdjustUp_Click()
If ClockUpOrDown = 1 Then
strAdjStopTime = strAdjStopTime + 1
Else: strAdjStopTime = strAdjStopTime - 1
End If
End Sub

Private Sub ClockUpOrDown_AfterUpdate()
If ClockUpOrDown = 1 Then
Me!ClockTime = Format(strPeriodTime / 86400, "nn:ss")
Else: Me!ClockTime = Format(((DefaultPeriodTime * 60) - strPeriodTime) / 86400, "nn:ss")
End If
End Sub

Private Sub COffsideAgMinus_Click()
OffsideAgainst = Nz(OffsideAgainst, 0) - 1
If OffsideAgainst = -1 Then
OffsideAgainst = 0
End If
End Sub

Private Sub COffsideAgPlus_Click()
OffsideAgainst = Nz(OffsideAgainst, 0) + 1
End Sub

Private Sub COffsideMinus_Click()
OffsideFor = Nz(OffsideFor, 0) - 1
If OffsideFor = -1 Then
OffsideFor = 0
End If
End Sub

Private Sub COffsidePlus_Click()
OffsideFor = Nz(OffsideFor, 0) + 1
End Sub




'Private Sub Command19_Click()
'Me!SubsForm.Requery
'
'End Sub

'Private Sub Command24_Click()
'Me.Requery
'
'End Sub

Private Sub Command25_Click()
PeriodNoHolder = Period
strGame = GameID
strCurrentGK = CurrentGK
Let strGameTime = Nz(DSum("TotalPeriodTime", "GamesInfoTimes", "GameGameInfoTimesID=" & strGameIDpub() & " And [period]<" & strPeriodNoHolderpub()), 0) + strPeriodTimepub()
If DLookup("FormsLayout", "DatabaseDefaults", "[id]=1") = -1 Then
strGameStatsForm = "GameStatsFormVersion3_InGameVertical"
Else: strGameStatsForm = "GameStatsFormVersion3_InGame"
End If
Me.Requery
End Sub

Private Sub EndPeriodButton_Click()
Let PeriodEndTime = Now()
Let [PlayedPeriodTime] = strPeriodTime
DoCmd.SetWarnings False
Call UpdateGameMinutes
DoCmd.RunCommand acCmdSaveRecord
Call UpdatePlayerGameMinutes
Call UpdateStarterMinutes
Call UpdateGKMin
UpdatePeriodTime
DoCmd.Close
DoCmd.OpenForm ("GameStatsFormVersion3"), , , "gamegameinfotimesid=" & strGame
Call Forms("GameStatsFormVersion3").FindPeriodSub
DoCmd.SetWarnings True
End Sub

Private Sub FixStartersSubs_Click()
DoCmd.OpenForm "GameStatsFormVersion3_Starters_Subs_Adjust"

End Sub



Private Sub Form_Load()
Let strPeriodStoppedTime = Nz(DSum("stoppedtime", "Games_InGame_Event_Times", "[GameID]=" & strGameIDpub() & " and [PeriodEventTime]=" & PeriodNoHolder), 0)
Let strAdjStopTime = 0
UpdatePeriodTime
Let [PlayedPeriodTime] = strPeriodTime
Call UpdateGameMinutes
End Sub

Private Sub Form_Open(Cancel As Integer)
DoCmd.Close acForm, ("navigationform")
DoCmd.Maximize
PeriodNoHolder = Nz(Period, 0)
If Period > RegPeriods Then
EndPeriodButton.Caption = "END OT PERIOD " & (Period - RegPeriods)
Else: EndPeriodButton.Caption = "END PERIOD " & Period
End If
Call UpdateGameStatsForm
End Sub

Private Sub Form_Timer()
UpdatePeriodTime
If ClockUpOrDown = 1 Then
Me!ClockTime = Format(strPeriodTime / 86400, "nn:ss")
Else: Me!ClockTime = Format(((DefaultPeriodTime * 60) - strPeriodTime) / 86400, "nn:ss")
End If
End Sub



Private Sub GameStoppageButton_Click()
UpdatePeriodTime
DoCmd.Close
DoCmd.OpenForm "GameStatsFormVersion3_Stoppage", , , , acFormAdd
End Sub

Private Sub SavesMinus_Click()
DoCmd.SetWarnings False
DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].Saves = Nz([Saves],0)-1 WHERE ((([Player-GameInfo].Saves)>0) AND (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()) AND (([Player-GameInfo].PlayerIDPlayerGameInfo)=strCurrentGKpub()))"
Me!GKStatsForm.Requery
DoCmd.SetWarnings True
SavesTotal.Requery
End Sub

Private Sub SavesPlus_Click()
DoCmd.SetWarnings False
DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].Saves = nz([Saves],0)+1 WHERE (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()) AND (([Player-GameInfo].PlayerIDPlayerGameInfo)=strCurrentGKpub())"
Me!GKStatsForm.Requery
DoCmd.SetWarnings True
SavesTotal.Requery
End Sub

Private Sub ShotByButton_AfterUpdate()
Dim ShotBy As Integer
ShotBy = Me!ShotByButton
DoCmd.SetWarnings False

DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].Shots = Nz([Player-GameInfo].Shots,0)+1 WHERE ((([Player-GameInfo].PlayerIDPlayerGameInfo)=  " & ShotBy & ") AND (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
Me!CurrentPlayersStats.Requery
DoCmd.SetWarnings True
ShotByButton = Null
End Sub
