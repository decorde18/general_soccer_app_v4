Attribute VB_Name = "Form_NavigationFormold"
Attribute VB_Base = "0{B4FD72BC-C0FF-41E5-9347-46AA185A0137}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False


Option Compare Database


Private Sub UpdateReports_Click()
On Error GoTo UpdateHTMLs_Err

    DoCmd.SetWarnings False
    DoCmd.OutputTo acOutputReport, "CareerPointsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerPoints.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerGoalsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerGoals.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerAssistsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerAssists.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerPlusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerPlus.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerPlusMinusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerPlusMinus.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonPointsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonPoints.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonGoalsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonGoals.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonAssistsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonAssists.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonPlusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonPlus.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonPlusMinusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonPlusMinus.pdf", False, "", , acExportQualityPrint
    'DoCmd.OutputTo acOutputForm, "SeasonStatsForExport", "PDFFormat(*.pdf)",strfilelocation & "STATSFiles\SeasonCurrent.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStats", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStats.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonRosterNumerically", "PDFFormat(*.pdf)", strFileLocation & "Roster.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "AllPlayersHistory", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllPlayersHistory.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "AllTimeSeasonResults", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllTimeSeasonResults.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "GameSchedule-Away Games", "PDFFormat(*.pdf)", strFileLocation & "GameSchedule-Away Games.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonOverviewReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonOverviewReport.pdf", False, "", , acExportQualityPrint
   DoCmd.OutputTo acOutputReport, "OpponentResultsSubReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllSeriesRecords.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "GameSchedule", "PDFFormat(*.pdf)", strFileLocation & "GameSchedule.pdf", False, "", , acExportQualityPrint
   DoCmd.OutputTo acOutputReport, "AllPlayersHistory", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllPlayersHistory.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonRosterNumericallyJVOnly", "PDFFormat(*.pdf)", strFileLocation & "RosterJVOnly.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonRosterNumericallyVarsityOnly", "PDFFormat(*.pdf)", strFileLocation & "RosterVarsityOnly.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "SeasonStatsGKSaves", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsGKSaves.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "SeasonStatsGKGAA", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsGKGAA.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "SeasonStatsGKSavePerc", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsGKSavePerc.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStatsGKSaves", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStatsGKSaves.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStatsGKGAA", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStatsGKGAA.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStatsGKSavePerc", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStatsGKSavePerc.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "SeasonStats", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsCurrent.pdf", False, "", , acExportQualityPrint
    DoCmd.RunCommand acCmdApplyFilterSort
UpdateHTMLs_Exit:
    Exit Sub

UpdateHTMLs_Err:
    MsgBox Error$
    Resume UpdateHTMLs_Exit

End Sub


Private Sub Command46_Click()
Access.Quit

End Sub






Private Sub UpdatePlayerMinutes_Click()
'Run Update Total game time played
DoCmd.RunSQL "UPDATE GamesTable INNER JOIN InGameStats ON GamesTable.GameID = InGameStats.GameIDInGame SET InGameStats.GameMinute = Nz(Nz([Minute],0)+Nz(DSum('TotalPeriodTime','GamesInfoTimes','[Period]< ' & [InGameStats]![Period] & ' and [GameGameInfoTimesID] =' & [InGameStats]![GameIDInGame]),0),0) WHERE (((GamesTable.SeasonIDGames)=strSeasonIDpub()))"
'Run Update Start Minutes
DoCmd.RunSQL "UPDATE GamesTable INNER JOIN [Player-GameInfo] ON GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo SET [Player-GameInfo].StartMinutes = Nz(DSum('TotalPeriodTime','GamesInfoTimes','GameGameInfoTimesID=' & [Player-GameInfo]![GameIDPlayerGameInfo]),0)*-([Player-GameInfo]![Start]) WHERE (((GamesTable.SeasonIDGames)=strSeasonIDpub()))"
'Run Subbed out Minutes
DoCmd.RunSQL "UPDATE GamesTable INNER JOIN [Player-GameInfo] ON GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo SET [Player-GameInfo].OutMinutes = DCount('SubUniqueID','InGameStats',' [GameIDInGame]=' & [Player-GameInfo]![GameIDPlayerGameInfo] & ' and  [PlayerNoout]= ' & [Player-GameInfo]![PlayerIDPlayerGameInfo])*Nz(DSum('TotalPeriodTime','GamesInfoTimes','[GameGameInfoTimesID]=' & [Player-GameInfo]![GameIDPlayerGameInfo]),0)-Nz(DSum('GameMinute','InGameStats',' [GameIDInGame]=' & [Player-GameInfo]![GameIDPlayerGameInfo] & ' and  [PlayerNoout]= ' & [Player-GameInfo]![PlayerIDPlayerGameInfo]),0) WHERE (((GamesTable.SeasonIDGames)=strSeasonIDpub()))"
'Run Subbed in Minutes
DoCmd.RunSQL "UPDATE GamesTable INNER JOIN [Player-GameInfo] ON GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo SET [Player-GameInfo].InMinutes = DCount('SubUniqueID','InGameStats',' [GameIDInGame]=' & [Player-GameInfo]![GameIDPlayerGameInfo] & ' and  [PlayerNoin]= ' & [Player-GameInfo]![PlayerIDPlayerGameInfo])*Nz(DSum('TotalPeriodTime','GamesInfoTimes','[GameGameInfoTimesID]=' & [Player-GameInfo]![GameIDPlayerGameInfo]),0)-Nz(DSum('GameMinute','InGameStats',' [GameIDInGame]=' & [Player-GameInfo]![GameIDPlayerGameInfo] & ' and  [PlayerNoin]= ' & [Player-GameInfo]![PlayerIDPlayerGameInfo]),0) WHERE (((GamesTable.SeasonIDGames)=strSeasonIDpub()))"

End Sub

Private Sub Form_Open(Cancel As Integer)
Let strSeason = Season

End Sub

Private Sub PrintReportButton_Click()
DoCmd.SelectObject acReport, strpubReportName, True
DoCmd.RunCommand acCmdPrint
End Sub

Private Sub Command641_Click()
Dim PWord As String
Dim FixedPassword As String
FixedPassword = "latin4488"

  PWord = InputBox("Enter Password to for DB Administration", "Enter Password")
If PWord = FixedPassword Then
DoCmd.ShowToolbar "Ribbon", acToolbarYes
DoCmd.RunCommand (acCmdDesignView)
DoCmd.Close acForm, "navigationbackground"
Else
MsgBox "Password Incorrect!"
End If
End Sub
     
 
 


Private Sub Command657_Click()
Dim Message, Title, Default, Message2
Dim SeasonInput As String
Message = "Type in the Season Year you would like to add"  ' Set prompt.

Title = "New Season"    ' Set title.
Default = Year(Now())    ' Set default.
' Display message, title, and default value.

DoCmd.SetWarnings False
Do
    SeasonInput = InputBox(Message, Title, Default)
    If IsNumeric(SeasonInput) Then If Len(SeasonInput) = 4 Then Exit Do
MsgBox "Please enter a Four Digit Year"
Loop
    DoCmd.RunSQL "INSERT INTO SeasonTable (Season) VALUES (" & SeasonInput & ")"

Season.Requery
Let Season = DLookup("[SeasonID]", "seasontable", "[season]=" & SeasonInput)
Let strSeason = Season
Me.Refresh

DoCmd.SetWarnings True
End Sub



Private Sub Form_Load()

Me.Section(acHeader).BackColor = RGB(Re, Gr, Bl)
Me.Section(acDetail).BackColor = RGB(Re, Gr, Bl)
Me.Title.ForeColor = RGB(Re2, Gr2, Bl2)
Me.SelectLabel.ForeColor = RGB(Re2, Gr2, Bl2)
Let strSeason = Season
Let strFileLocation = DLookup("filelocation", "databasedefaults")
End Sub





Private Sub Season_AfterUpdate()
Me.Refresh
strSeason = Season

End Sub
Private Sub Command211_Click()
If DLookup("FormsLayout", "DatabaseDefaults", "[id]=1") = -1 Then
strGameStatsForm = "GameStatsFormVersion2"
Else: strGameStatsForm = "GameStatsFormVersion2Horizontal"
End If
DoCmd.Close acForm, ("navigationform")
DoCmd.OpenForm strGameStatsForm, acNormal, "", "", , acNormal

End Sub



Private Sub TeamSettingsButton_Click()

    DoCmd.OpenForm "DatabaseDefaultsForm", acNormal, "", "", , acNormal
DoCmd.Close acForm, ("navigationform")
End Sub


