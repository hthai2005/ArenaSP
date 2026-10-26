import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api } from '../api/client'
import { useAuth } from './AuthContext'


const DataContext = createContext(null)


const DEFAULT_HALL_IMAGE =
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80'


// =====================================================
// LOẠI BỎ FIELD UNDEFINED
// =====================================================

function cleanObject(obj) {

  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) =>
        value !== undefined,
    ),
  )
}


// =====================================================
// MAP STADIUM
// =====================================================

function mapStadium(item) {

  return {
    id: item.id,

    name: item.name,

    officialName:
      item.officialName ??
      item.official_name ??
      '',

    address:
      item.address,

    area:
      item.area ??
      0,

    capacity:
      item.capacity ??
      0,

    description:
      item.description ??
      '',

    status:
      item.status,
  }
}


// =====================================================
// MAP HALL
// =====================================================

function mapHall(item) {

  return {
    id: item.id,

    code:
      item.code,

    name:
      item.name,

    stadiumId:
      item.stadiumId ??
      item.stadium_id,

    type:
      item.type ??
      '',

    capacity:
      item.capacity ??
      0,

    equipment:
      item.equipment ??
      '',

    status:
      item.status,

    image:
      item.image ||
      DEFAULT_HALL_IMAGE,

    description:
      item.description ??
      '',
  }
}


// =====================================================
// MAP EQUIPMENT
// =====================================================

function mapEquipment(item) {

  return {
    id:
      item.id,

    code:
      item.code,

    name:
      item.name,

    hallId:
      item.hallId ??
      item.hall_id ??
      null,

    quantity:
      item.quantity ??
      1,

    status:
      item.status,

    inspectedAt:
      item.inspectedAt ??
      item.inspected_at ??
      '',

    description:
      item.description ??
      '',
  }
}


// =====================================================
// MAP SCHEDULE
// =====================================================

function mapSchedule(item) {

  return {
    id:
      item.id,

    hallId:
      item.hallId ??
      item.hall_id,

    title:
      item.title,

    startTime:
      item.startTime ??
      item.start_time,

    endTime:
      item.endTime ??
      item.end_time,

    status:
      item.status,

    description:
      item.description ??
      '',

    createdAt:
      item.createdAt ??
      item.created_at ??
      null,

    updatedAt:
      item.updatedAt ??
      item.updated_at ??
      null,
  }
}


// =====================================================
// MAP BOOKING
// =====================================================

function mapBooking(item) {

  return {
    id:
      item.id,

    userId:
      item.userId ??
      item.user_id,

    hallId:
      item.hallId ??
      item.hall_id,

    title:
      item.title,

    startTime:
      item.startTime ??
      item.start_time,

    endTime:
      item.endTime ??
      item.end_time,

    status:
      item.status,

    note:
      item.note ??
      '',

    createdAt:
      item.createdAt ??
      item.created_at ??
      null,

    updatedAt:
      item.updatedAt ??
      item.updated_at ??
      null,
  }
}


// =====================================================
// MAP ACTIVITY LOG
// =====================================================

function mapLog(item) {

  return {
    id:
      item.id,

    userId:
      item.userId ??
      item.user_id,

    action:
      item.action,

    target:
      item.target ??
      '',

    description:
      item.description ??
      '',

    createdAt:
      item.createdAt ??
      item.created_at,
  }
}


// =====================================================
// MAP PREDICTION
// =====================================================

function mapPrediction(item) {

  return {
    id:
      item.id,

    hallId:
      item.hallId ??
      item.hall_id,

    predictionDate:
      item.predictionDate ??
      item.prediction_date,

    predictedUsage:
      item.predictedUsage ??
      item.predicted_usage ??
      0,

    riskLevel:
      item.riskLevel ??
      item.risk_level ??
      'LOW',

    recommendedTime:
      item.recommendedTime ??
      item.recommended_time ??
      '',

    createdAt:
      item.createdAt ??
      item.created_at ??
      null,
  }
}


// =====================================================
// DATA PROVIDER
// =====================================================

export function DataProvider({
  children,
}) {

  const {
    user,
    logout,
  } = useAuth()


  const [
    stadiums,
    setStadiums,
  ] = useState([])


  const [
    halls,
    setHalls,
  ] = useState([])


  const [
    equipment,
    setEquipment,
  ] = useState([])


  const [
    schedules,
    setSchedules,
  ] = useState([])


  const [
    bookings,
    setBookings,
  ] = useState([])


  const [
    logs,
    setLogs,
  ] = useState([])


  const [
    predictions,
    setPredictions,
  ] = useState([])


  const [
    dashboardReport,
    setDashboardReport,
  ] = useState(null)


  const [
    occupancy,
    setOccupancy,
  ] = useState([])


  const [
    dailyOccupancy,
    setDailyOccupancy,
  ] = useState([])


  const [
    loading,
    setLoading,
  ] = useState(false)


  // ==================================================
  // XỬ LÝ TOKEN HẾT HẠN
  // ==================================================

  const handleAuthError =
    useCallback(
      (err) => {

        if (
          err.status === 401
        ) {
          logout()
        }

        throw err
      },
      [logout],
    )


  // ==================================================
  // GET API CÓ THỂ KHÔNG CÓ QUYỀN
  // ==================================================

  const optionalGet =
    useCallback(
      async (
        path,
        fallback,
      ) => {

        try {

          return await api(path)

        } catch (err) {

          if (
            err.status === 403 ||
            err.status === 404
          ) {
            return fallback
          }

          return handleAuthError(
            err,
          )
        }
      },
      [handleAuthError],
    )


  // ==================================================
  // LOAD TOÀN BỘ DỮ LIỆU
  // ==================================================

  const refresh =
    useCallback(
      async () => {

        if (!user) {

          setStadiums([])
          setHalls([])
          setEquipment([])
          setSchedules([])
          setBookings([])
          setLogs([])
          setPredictions([])

          setDashboardReport(
            null,
          )

          setOccupancy([])
          setDailyOccupancy([])

          return
        }


        setLoading(true)


        try {

          const [
            stadiumRows,
            hallRows,
            equipmentRows,
            scheduleRows,
            bookingRows,
            logRows,
            predictionRows,
            reportRow,
            occupancyRows,
            dailyRows,
          ] =
            await Promise.all([

              optionalGet(
                '/api/stadiums/',
                [],
              ),

              optionalGet(
                '/api/halls/',
                [],
              ),

              optionalGet(
                '/api/equipments/',
                [],
              ),

              optionalGet(
                '/api/schedules/',
                [],
              ),

              optionalGet(
                '/api/bookings/',
                [],
              ),

              optionalGet(
                '/api/activity-logs/',
                [],
              ),

              optionalGet(
                '/api/predictions/',
                [],
              ),

              optionalGet(
                '/api/reports/dashboard',
                null,
              ),

              optionalGet(
                '/api/reports/occupancy',
                [],
              ),

              optionalGet(
                '/api/reports/occupancy/daily',
                [],
              ),
            ])


          setStadiums(
            (stadiumRows || [])
              .map(mapStadium),
          )


          setHalls(
            (hallRows || [])
              .map(mapHall),
          )


          setEquipment(
            (equipmentRows || [])
              .map(mapEquipment),
          )


          setSchedules(
            (scheduleRows || [])
              .map(mapSchedule),
          )


          setBookings(
            (bookingRows || [])
              .map(mapBooking),
          )


          setLogs(
            (logRows || [])
              .map(mapLog),
          )


          setPredictions(
            (predictionRows || [])
              .map(mapPrediction),
          )


          setDashboardReport(
            reportRow || null,
          )


          setOccupancy(
            occupancyRows || [],
          )


          setDailyOccupancy(
            dailyRows || [],
          )

        } finally {

          setLoading(false)
        }

      },
      [
        user,
        optionalGet,
      ],
    )


  useEffect(() => {

    refresh()

  }, [refresh])


  // ==================================================
  // REFRESH LOG
  // ==================================================

  const refreshLogs =
    useCallback(
      async () => {

        const rows =
          await optionalGet(
            '/api/activity-logs/',
            [],
          )

        setLogs(
          (rows || [])
            .map(mapLog),
        )

        return rows
      },
      [optionalGet],
    )


  // ==================================================
  // REFRESH BOOKINGS
  // ==================================================

  const refreshBookings =
    useCallback(
      async () => {

        const rows =
          await optionalGet(
            '/api/bookings/',
            [],
          )

        setBookings(
          (rows || [])
            .map(mapBooking),
        )

        return rows
      },
      [optionalGet],
    )


  // ==================================================
  // REFRESH SCHEDULE
  // ==================================================

  const refreshSchedules =
    useCallback(
      async () => {

        const rows =
          await optionalGet(
            '/api/schedules/',
            [],
          )

        setSchedules(
          (rows || [])
            .map(mapSchedule),
        )

        return rows
      },
      [optionalGet],
    )


  // ==================================================
  // REFRESH REPORT
  // ==================================================

  const refreshReports =
    useCallback(
      async () => {

        const [
          summary,
          hallRows,
          dailyRows,
        ] =
          await Promise.all([

            optionalGet(
              '/api/reports/dashboard',
              null,
            ),

            optionalGet(
              '/api/reports/occupancy',
              [],
            ),

            optionalGet(
              '/api/reports/occupancy/daily',
              [],
            ),
          ])


        setDashboardReport(
          summary,
        )

        setOccupancy(
          hallRows || [],
        )

        setDailyOccupancy(
          dailyRows || [],
        )

      },
      [optionalGet],
    )


  // ==================================================
  // STADIUM
  // ==================================================

  const addStadium =
    async (item) => {

      const created =
        await api(
          '/api/stadiums/',
          {
            method: 'POST',

            body:
              cleanObject(
                item,
              ),
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return created
    }


  const updateStadium =
    async (
      id,
      patch,
    ) => {

      const result =
        await api(
          `/api/stadiums/${id}`,
          {
            method: 'PUT',

            body:
              cleanObject(
                patch,
              ),
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return result
    }


  const removeStadium =
    async (id) => {

      const result =
        await api(
          `/api/stadiums/${id}`,
          {
            method: 'DELETE',
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return result
    }


  // ==================================================
  // HALL
  // ==================================================

  const addHall =
    async (item) => {

      const created =
        await api(
          '/api/halls/',
          {
            method: 'POST',

            body:
              cleanObject({

                code:
                  item.code,

                stadiumId:
                  item.stadiumId,

                name:
                  item.name,

                type:
                  item.type,

                capacity:
                  item.capacity,

                status:
                  item.status,

                description:
                  item.description ||
                  null,

                image:
                  item.image ||
                  null,
              }),
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return created
    }


  const updateHall =
    async (
      id,
      patch,
    ) => {

      const result =
        await api(
          `/api/halls/${id}`,
          {
            method: 'PUT',

            body:
              cleanObject({

                code:
                  patch.code,

                stadiumId:
                  patch.stadiumId,

                name:
                  patch.name,

                type:
                  patch.type,

                capacity:
                  patch.capacity,

                status:
                  patch.status,

                description:
                  patch.description,

                image:
                  patch.image,
              }),
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return result
    }


  const removeHall =
    async (id) => {

      const result =
        await api(
          `/api/halls/${id}`,
          {
            method: 'DELETE',
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return result
    }


  // ==================================================
  // EQUIPMENT
  // ==================================================

  const addEquipment =
    async (item) => {

      const created =
        await api(
          '/api/equipments/',
          {
            method: 'POST',

            body:
              cleanObject({

                code:
                  item.code,

                name:
                  item.name,

                hallId:
                  item.hallId === ''
                    ? null
                    : item.hallId,

                quantity:
                  item.quantity,

                inspectedAt:
                  item.inspectedAt ||
                  null,

                status:
                  item.status,

                description:
                  item.description ||
                  null,
              }),
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return created
    }


  const updateEquipment =
    async (
      id,
      patch,
    ) => {

      const body = {}


      if (
        patch.code !==
        undefined
      ) {
        body.code =
          patch.code
      }


      if (
        patch.name !==
        undefined
      ) {
        body.name =
          patch.name
      }


      if (
        patch.hallId !==
        undefined
      ) {

        body.hallId =
          patch.hallId === ''
            ? null
            : patch.hallId
      }


      if (
        patch.quantity !==
        undefined
      ) {
        body.quantity =
          patch.quantity
      }


      if (
        patch.inspectedAt !==
        undefined
      ) {

        body.inspectedAt =
          patch.inspectedAt ||
          null
      }


      if (
        patch.status !==
        undefined
      ) {
        body.status =
          patch.status
      }


      if (
        patch.description !==
        undefined
      ) {
        body.description =
          patch.description
      }


      const result =
        await api(
          `/api/equipments/${id}`,
          {
            method: 'PUT',
            body,
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return result
    }


  const removeEquipment =
    async (id) => {

      const result =
        await api(
          `/api/equipments/${id}`,
          {
            method: 'DELETE',
          },
        ).catch(
          handleAuthError,
        )


      await refresh()

      return result
    }


  // ==================================================
  // SCHEDULE
  // ==================================================

  const addSchedule =
    async (item) => {

      const created =
        await api(
          '/api/schedules/',
          {
            method: 'POST',

            body:
              cleanObject(
                item,
              ),
          },
        ).catch(
          handleAuthError,
        )


      await refreshSchedules()
      await refreshReports()
      await refreshLogs()


      return created
    }


  const updateSchedule =
    async (
      id,
      patch,
    ) => {

      const updated =
        await api(
          `/api/schedules/${id}`,
          {
            method: 'PUT',

            body:
              cleanObject(
                patch,
              ),
          },
        ).catch(
          handleAuthError,
        )


      await refreshSchedules()
      await refreshReports()
      await refreshLogs()


      return updated
    }


  const removeSchedule =
    async (id) => {

      const result =
        await api(
          `/api/schedules/${id}`,
          {
            method:
              'DELETE',
          },
        ).catch(
          handleAuthError,
        )


      await refreshSchedules()
      await refreshReports()
      await refreshLogs()


      return result
    }


  // ==================================================
  // BOOKING
  // ==================================================

  const createBooking =
    async (item) => {

      const created =
        await api(
          '/api/bookings/',
          {
            method: 'POST',

            body:
              cleanObject(
                item,
              ),
          },
        ).catch(
          handleAuthError,
        )


      await refreshBookings()
      await refreshLogs()


      return created
    }


  const approveBooking =
    async (id) => {

      const result =
        await api(
          `/api/bookings/${id}/approve`,
          {
            method: 'POST',
          },
        ).catch(
          handleAuthError,
        )


      await refreshBookings()
      await refreshSchedules()
      await refreshReports()
      await refreshLogs()


      return result
    }


  const rejectBooking =
    async (id) => {

      const result =
        await api(
          `/api/bookings/${id}/reject`,
          {
            method: 'POST',
          },
        ).catch(
          handleAuthError,
        )


      await refreshBookings()
      await refreshLogs()


      return result
    }


  const cancelBooking =
    async (id) => {

      const result =
        await api(
          `/api/bookings/${id}/cancel`,
          {
            method: 'POST',
          },
        ).catch(
          handleAuthError,
        )


      await refreshBookings()
      await refreshSchedules()
      await refreshReports()
      await refreshLogs()


      return result
    }


  // ==================================================
  // RANDOM FOREST PREDICTION
  // ==================================================

  const runPrediction =
    async (
      hallId,
      predictionDate,
    ) => {

      const result =
        await api(
          '/api/predictions/predict',
          {
            method: 'POST',

            body: {
              hallId:
                Number(hallId),

              predictionDate,
            },
          },
        ).catch(
          handleAuthError,
        )


      const mapped =
        mapPrediction(
          result,
        )


      setPredictions(
        (list) => [
          mapped,

          ...list.filter(
            (p) =>
              p.id !==
              mapped.id,
          ),
        ],
      )


      return mapped
    }


  const trainPredictionModel =
    async () => {

      return api(
        '/api/predictions/train',
        {
          method: 'POST',
        },
      ).catch(
        handleAuthError,
      )
    }


  // ==================================================
  // MAP HALL ID
  // ==================================================

  const hallById =
    useMemo(
      () =>
        Object.fromEntries(
          halls.map(
            (hall) => [
              hall.id,
              hall,
            ],
          ),
        ),
      [halls],
    )


  // ==================================================
  // PROVIDER
  // ==================================================

  return (

    <DataContext.Provider
      value={{
        stadiums,
        halls,
        equipment,
        schedules,
        bookings,
        logs,
        predictions,
        dashboardReport,
        occupancy,
        dailyOccupancy,
        loading,
        hallById,

        refresh,
        refreshLogs,
        refreshBookings,
        refreshSchedules,
        refreshReports,

        addStadium,
        updateStadium,
        removeStadium,

        addHall,
        updateHall,
        removeHall,

        addEquipment,
        updateEquipment,
        removeEquipment,

        addSchedule,
        updateSchedule,
        removeSchedule,

        createBooking,
        approveBooking,
        rejectBooking,
        cancelBooking,

        runPrediction,
        trainPredictionModel,
      }}
    >

      {children}

    </DataContext.Provider>
  )
}


export function useData() {

  const ctx =
    useContext(DataContext)

  if (!ctx) {

    throw new Error(
      'useData must be used inside DataProvider',
    )
  }

  return ctx
}