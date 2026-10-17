Attribute VB_Name = "Form_GameStatsFormVersion3_AfterGameForm_Events_Subform"
Attribute VB_Base = "0{63C72610-3C78-4623-BF1A-B7742E28E4F2}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Event_AfterUpdate()
Let GameID = strGame
End Sub

'------------------------------------------------------------
' GoalScoredDetails_Click
'
'------------------------------------------------------------
Private Sub GoalScoredDetails_Click()
strGameEvent = GameEventID
If [Event] = 1 Then DoCmd.OpenForm "GameStatsFormVersion3_AfterGameForm_Stoppage", acNormal, "", "[GameEventID]=" & strGameEvent, , acNormal
If [Event] = 2 Then DoCmd.OpenForm "GameStatsFormVersion3_AfterGameForm_StoppageGA", acNormal, "", "[GameEventID]=" & strGameEvent, , acNormal

End Sub


Private Sub StopClock_AfterUpdate()

If StopClock = 0 Then
DoCmd.RunSQL "UPDATE InGameStats SET InGameStats.[Minute] = InGameStats.[Minute]+[stoppedtime], InGameStats.GameMinute = InGameStats.GameMinute+[stoppedtime]  WHERE (((InGameStats.Period)>=[periodeventtime]) AND ((InGameStats.Minute)>=[eventtime]) AND ((InGameStats.GameIDInGame)=strGameIDpub()))"
Else
DoCmd.RunSQL "UPDATE InGameStats SET InGameStats.[Minute] = InGameStats.[Minute]-([timeend]-[timebegin]), InGameStats.GameMinute = InGameStats.GameMinute-([timeend]-[timebegin])  WHERE (((InGameStats.Period)>=[periodeventtime]) AND ((InGameStats.Minute)>=[eventtime]) AND ((InGameStats.GameIDInGame)=strGameIDpub()))"
End If
End Sub
